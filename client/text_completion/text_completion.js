window.addEventListener('DOMContentLoaded', () => {
    const domain = "192.168.217.100"; //"192.168.1.20";
    let btn = document.querySelector("#btn");
    let txt = document.querySelector("#txt");
    let temperature = document.querySelector("#temperature");
    
    let validator = document.querySelector("#validator");
    let spinner = document.querySelector("#spinner");
    let response = document.querySelector("#response-ok");
    let response_error = document.querySelector("#response-error");
    let response_usage = document.querySelector("#response-usage");

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

    const validate_input = function() {        
        let txt_input = txt.value.trim();
        validator.style.display = "none";
        
        if(txt_input === "") {
            validator.style.display = "inline-block";
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

    const render_good_response = (p_txt, usage) => {
        var speed = 70; /* The speed/duration of the effect in milliseconds */
        var txt = p_txt;
        i = 0;
        response.innerHTML = "";
        typeWriter();
        
        function typeWriter() {
            if (i < txt.length) {
                response.innerHTML += txt.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        }

        response_usage.innerHTML = `<b>Token Usage</b> <br>request: ${usage.prompt_tokens} <br>response: ${usage.completion_tokens} <br>total: ${usage.total_tokens}`;
    };

    txt.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            trigger_text_completion();
        }
    });
    
    btn.addEventListener("click", e => {
        trigger_text_completion();
    }, false);

    const trigger_text_completion = ()=> {
        
        if(validate_input() === true) {
            btn.style.display = "none";
            spinner.style.display = "block";
            response_error.innerHTML = "";
            
            $.ajax({
                type: "POST",
                url: `http://${domain}:8000/post_text_completion`,
                dataType: "json",
                data: { 
                    animal:  txt.value.trim(),
                    temperature: temperature.value.trim() 
                }
            }).done( data => {
                btn.style.display = "block";
                spinner.style.display = "none";
                response.innerHTML = "";
                response_usage.innerHTML = "";
                
                if(data.finish_reason === 'stop') {
                    render_good_response(data.text, data.usage);
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
});