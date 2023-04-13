window.addEventListener('DOMContentLoaded', () => {
    const domain = "192.168.1.20"; //"192.168.1.20";
    let btn = document.querySelector("#btn");
    let txt = document.querySelector("#txt");
    let temperature = document.querySelector("#temperature");
    
    let validator = document.querySelector("#validator");
    let spinner = document.querySelector("#spinner");
    let chat_container = document.querySelector("#chat-container");
    let chat_container_inner = document.querySelector("#chat-container-inner");
    let response_error = document.querySelector("#response-error");
    let response_usage = document.querySelector("#response-usage");
    const prepare_message = "a helpful assistant that specializes in recommending TV series to viewers."
    let chat_history = [{ 
        "role": "system", 
        "content": `You are ${prepare_message}`
    }];

    document.querySelector("#prepare-txt").innerText = `Hi there, I'm ${prepare_message}`;

    $.ajax({
        url: `http://${domain}:8000/ping`, 
        method: 'GET', 
        timeout: 0 
    }).done((data, textStatus, jqXHR) => {
        if(jqXHR.status === 200) {
            console.log(data);
        }
    }).fail( (jqXHR, textStatus, errorThrown) => {                               
        
    });

    const validate_input = () => {        
        let txt_input = txt.value.trim();
        validator.style.display = "none";
        
        if(txt_input === "") {
            validator.style.display = "block";
        }
        
        return txt_input !== "";
    };

    const render_bad_response = (data) => {
        if(data.finish_reason === "length") {
            response_error.innerHTML = `finish reason: ${data.finish_reason}, incomplete model output due to max_tokens parameter or token limit.`;

        } else if(data.finish_reason === "content_filter") {
            response_error.innerHTML = `finish reason: ${data.finish_reason}, omitted content due to a flag from our content filters.`;
        }
    };

    const render_good_response = (div, p_txt, env) => {
        let speed = p_txt <= 220 ? 70 : 20; /* The speed/duration of the effect in milliseconds */
        let i = 0;
        div.innerHTML = "<span class='bold'>Assistant:</span>"; 
        if(env !== "ci") {            
            type_writer();
        } else {
            div.innerHTML += p_txt;
        }
        
        const type_writer = () => {
            if (i < p_txt.length) {
                div.innerHTML += p_txt.charAt(i);
                chat_container.scrollTo(0, chat_container_inner.getBoundingClientRect().height);
                i++;
                setTimeout(typeWriter, speed);
            }
        }; 
    };

    const trigger_chat_completion = () => {
        
        if(validate_input() === true) {
            
            pre_request_logic();
            
            $.ajax({
                type: "POST",
                url: `http://${domain}:8000/post_chat_completion`,
                dataType: "json",
                data: { 
                    chat_history: chat_history,                    
                    temperature: temperature.value.trim()
                }
            }).done( data => {
                btn.style.display = "block";
                spinner.style.display = "none";                
                txt.value = "";
                
                if(data.finish_reason === 'stop') {
                    chat_history.push({ 
                        "role": "assistant", 
                        "content": data.text
                    }); 

                    let assistant_div = document.createElement("div");
                    assistant_div.classList.add("chat-item-assistant");

                    chat_container_inner.appendChild(assistant_div); 
                    
                    render_good_response(assistant_div, data.text, data.env);
                    chat_container.scrollTo(0, chat_container_inner.getBoundingClientRect().height);
                    response_usage.style.display = "block";
                    response_usage.innerHTML = `<b>Token Usage</b> request: ${data.usage.prompt_tokens} response: ${data.usage.completion_tokens} total: ${data.usage.total_tokens}`;
                    
                } else if (data.finish_reason === "length" || data.finish_reason === "content_filter"){
                    render_bad_response(data);
                }
                                
            }).fail(err => {
                btn.style.display = "block";
                spinner.style.display = "none";
                console.log(err.responseText);
            });
        }
    };

    txt.addEventListener("input", e => {
        if(e.target.value.length >= 2) {
            validator.style.display = "none";
        }
    });
    
    btn.addEventListener("click", e => {
        trigger_chat_completion();
    }, false);

    const pre_request_logic = () => {
        chat_history.push({ 
            "role": "user", 
            "content": txt.value.trim() 
        });

        let user_div = document.createElement("div");
        user_div.classList.add("chat-item-user");
        user_div.innerHTML = `<span class="bold">User:</span> ${txt.value.trim()}`;
        chat_container_inner.appendChild(user_div); 

        btn.style.display = "none";
        spinner.style.display = "block";
    };

});