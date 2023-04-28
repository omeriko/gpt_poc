window.addEventListener('DOMContentLoaded', () => {
    const domain = "localhost"; //"192.168.1.20";
    let btn = document.querySelector("#btn");
    let txt = document.querySelector("#txt");
    
    let validator = document.querySelector("#validator");
    let spinner = document.querySelector("#spinner");
    let response = document.querySelector("#response-ok");
    let response_error = document.querySelector("#response-error");
    let response_usage = document.querySelector("#response-usage");
    let img_response = document.querySelector("#img-response");

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
    
    const validate_input = function() {        
        let txt_input = txt.value.trim();
        validator.style.display = "none";
        
        if(txt_input === "") {
            validator.style.display = "inline-block";
        }
        
        return txt_input !== "";
    };

    const render_bad_response = (data) => {
        response_error.innerHTML = data;
    };

    const render_good_response = (url) => {
        img_response.src = url;
        img_response.style.display = "block";
    };

    txt.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            trigger_text_completion();
        }
    });
    
    btn.addEventListener("click", e => {
        trigger_text_completion();
    }, false);

    const trigger_text_completion = () => {
        
        if(validate_input() === true) {
            btn.style.display = "none";
            spinner.style.display = "block";
            
            img_response.style.display = "none";
            response_error.innerHTML = "";
            response_usage.innerHTML = "";

            $.ajax({
                type: "POST",
                url: `http://${domain}:8000/post_image_generation`,
                dataType: "json",
                data: { prompt:  txt.value.trim() }
            }).done( data => {
                btn.style.display = "block";
                spinner.style.display = "none";                               
                              
                render_good_response(data.url);
            }).fail(err => {
                btn.style.display = "block";
                spinner.style.display = "none";
                render_bad_response(err.responseText);
            });
        }
    };
});