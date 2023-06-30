window.addEventListener('DOMContentLoaded', () => {
    const domain = "localhost"; //"192.168.1.20";
    const img = document.querySelector("#img");
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

    $.get(`http://${domain}:8000/qr_code`, (data, status) => {
        img.src = data;
    });

});