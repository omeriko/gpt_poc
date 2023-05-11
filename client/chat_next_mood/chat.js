window.addEventListener('DOMContentLoaded', () => {
    const minimun_series = 3;
    const minimun_moods = 1;
    const domain = "localhost"; //"192.168.1.20";
    let btn = document.querySelector("#btn-next");
    let btn_clear = document.querySelector("#btn-clear");
    
    let validator = document.querySelector("#validator");
    
    let temperature = document.querySelector("#temperature");
    
    let spinner = document.querySelector("#spinner-next");
    let chat_container = document.querySelector("#chat-container");
    let chat_container_inner = document.querySelector("#chat-container-inner");
    let response_error = document.querySelector("#response-error");
    let response_usage = document.querySelector("#response-usage");
    
    const fetchHeader = async () => {
        try {
            const res = await fetch("header");
            const template = await res.text();
            document.querySelector(".header").innerHTML = template;
        } catch (err) {
            console.log(err);
        }
    };

    fetchHeader();

    const render_bad_response = (data) => {
        if(data.finish_reason === "length") {
            response_error.innerHTML = `finish reason: ${data.finish_reason}, incomplete model output due to max_tokens parameter or token limit.`;

        } else if(data.finish_reason === "content_filter") {
            response_error.innerHTML = `finish reason: ${data.finish_reason}, omitted content due to a flag from our content filters.`;
        }
    };

    const render_good_response = (div, p_txt, env, duration, arr_user_series) => {
        let speed = p_txt <= 220 ? 70 : 10; /* The speed/duration of the effect in milliseconds */
        let i = 0;
        
        div.innerHTML = "<span class='bold' style='color:darkgreen'>GPT-3.5 answer: </span>"; 
        if(env !== "ci") {            
            p_txt = insert_line_breaks(p_txt);

            arr_user_series.forEach( item => {
                p_txt = p_txt.replaceAll(item, `<b>${item}</b>`)
            });

            div.innerHTML += p_txt;
        } else {
            div.innerHTML += p_txt;
        }

        div.innerHTML += `<br><span style="color:gray; font-size: 0.9em">(duration: ${duration})<span/>`;
        
        function type_writer (){
            if (i < p_txt.length) {
                div.innerHTML += p_txt.charAt(i);                
                chat_container.scrollTo(0, chat_container_inner.getBoundingClientRect().height);
                i++;
                setTimeout(type_writer, speed);
            } else {
                div.innerHTML += `<br><span style="color:gray; font-size: 0.9em">(duration: ${duration})<span/>`;
            }
        } 

        function insert_line_breaks(txt) {
            const max_length = 10;

            for(let i = 0; i < max_length; i++) {
                txt = txt.replace(`${i.toString()}.`, `<br><br>${i.toString()}.`);
            }            
            return txt;
        }
    };

    const trigger_chat_completion = () => {

        validator.style.display = "none";
        const arr_user_series = pre_request_series_logic();
        const arr_user_moods = pre_request_moods_logic();

        //console.log(arr_user_series);
        if(arr_user_series.length + arr_user_moods.length > 0) {
            btn.setAttribute("disabled", "");
            spinner.style.display = "block";
            
            $.ajax({
                type: "POST",
                url: `http://${domain}:8000/post_chat_completion3`,
                dataType: "json",
                data: { 
                    few_user_series: arr_user_series, 
                    user_moods: arr_user_moods,                  
                    temperature: temperature.value.trim()
                }
            }).done( data => {
                btn_clear.style.display = "block";
                btn.removeAttribute("disabled");
                spinner.style.display = "none";
                
                if(data.finish_reason === 'stop') {

                    let assistant_div = document.createElement("div");
                    assistant_div.classList.add("chat-item-assistant");

                    chat_container_inner.appendChild(assistant_div); 
                    
                    render_good_response(assistant_div, data.text, data.env, data.duration, arr_user_series);
                    chat_container.scrollTo(0, chat_container_inner.getBoundingClientRect().height);
                    response_usage.style.display = "block";
                    response_usage.innerHTML = `<b>Token Usage</b> request: ${data.usage.prompt_tokens} response: ${data.usage.completion_tokens} total: ${data.usage.total_tokens}`;
                    
                } else if (data.finish_reason === "length" || data.finish_reason === "content_filter"){
                    render_bad_response(data);
                }
                                
            }).fail(err => {
                btn.removeAttribute("disabled");
                spinner.style.display = "none";
                console.log(err.responseText);
            });

        } else {            
            validator.style.display = "block";
        }
    };
   
    btn_clear.addEventListener("click", e => {
        clear_prev_request();
        e.target.style.display = "none";
    }, false);

    btn.addEventListener("click", e => {
        trigger_chat_completion();
    }, false);
    
    const clear_prev_request = () => {
        response_usage.style.display = "none";
        response_usage.innerHTML = "";
        chat_container_inner.innerHTML = "";
        [...document.querySelectorAll(".series .form-check-inline")].forEach(item => item.querySelector("input").checked = false);
            
        [...document.querySelectorAll(".moods  .form-check-inline")].forEach(item => item.querySelector("input").checked = false);
    };

    const pre_request_series_logic = () => {
        let result = [];
        [...document.querySelectorAll(".series .form-check-inline")].forEach(item => {
            if(item.querySelector("input").checked === true) {
                result.push(item.querySelector("label").innerText);
            }
        });
        
        return result;
    };

    const pre_request_moods_logic = () => {
        let result = [];
        [...document.querySelectorAll(".moods .form-check-inline")].forEach(item => {
            if(item.querySelector("input").checked === true) {
                result.push(item.querySelector("label").innerText);
            }
        });
        
        return result;
    };

});