const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { parse } = require("csv-parse");
const path = require("path");
const fsPromises = require("fs/promises");
const keys = require("./config/keys");

console.log(process.env.NODE_ENV);
const configuration = new Configuration({
    apiKey: keys.OPEN_AI_TOKEN
  });

const openai = new OpenAIApi(configuration);

const app = express();
app.use(express.urlencoded({limit: "42mb", parameterLimit: 3000}));
app.use(bodyParser.json());

var whitelist = ['http://localhost:8000','http://192.168.1.20:8000', "null"];
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
};

//const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/styles.css', express.static(path.join(__dirname, '../', 'client', 'styles.css' )));

app.use('/chat', express.static(path.join(__dirname, '../', 'client', 'chat', 'chat.html' )));
app.use('/chat.js', express.static(path.join(__dirname, '../', 'client', 'chat', 'chat.js' )));

app.use('/chat_next', express.static(path.join(__dirname, '../', 'client', 'chat_next', 'chat.html' )));
app.use('/chat_next.js', express.static(path.join(__dirname, '../', 'client', 'chat_next', 'chat.js' )));

app.use('/chat_next_mood', express.static(path.join(__dirname, '../', 'client', 'chat_next_mood', 'chat.html' )));
app.use('/chat_next_mood.js', express.static(path.join(__dirname, '../', 'client', 'chat_next_mood', 'chat.js' )));

app.use('/text_completion', express.static(path.join(__dirname, '../', 'client', 'text_completion', 'text_completion.html' )));
app.use('/text_completion.js', express.static(path.join(__dirname, '../', 'client', 'text_completion', 'text_completion.js' )));

app.use('/image', express.static(path.join(__dirname, '../', 'client', 'image', 'image_generation.html' )));
app.use('/image_generation.js', express.static(path.join(__dirname, '../', 'client', 'image', 'image_generation.js' )));

app.use('/header', express.static(path.join(__dirname, '../', 'client', 'header.txt' )));

app.get('/ping', [cors(corsOptionsDelegate)], (req, res) => {
    const text = "ok-poc";      
    return res.status(200).send(text);
});

app.get('/csv-to-text', [cors(corsOptionsDelegate)], async (req, res) => {    
    //const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const txt_filename = path.join(__dirname, '../', 'series.txt');

    await fsPromises.truncate(txt_filename, 0);

    fs.createReadStream(path.join(__dirname, '../', '123.csv'))
    .pipe(parse({ delimiter: ",", from_line:2}))
    .on("data", async row => {
        let json_item = JSON.parse(row[5]);
        //console.log(json_item.Eng_Title);
        
        let sanitized_txt = json_item.Eng_Title.replace(/Se\.\d-\d|Se\.\d/i ,"");

        await fsPromises.appendFile(txt_filename, `${sanitized_txt.trim()},`, "utf-8");
    })
    .on("error", err => {
        console.log(err.message);
    });
    
    const text = "ok-poc";      
    return res.status(200).send(text);
});

app.post('/post_text_completion', [cors(corsOptionsDelegate)], async (req, res) => {
    
    const animal = req.body.animal;
    const temperature = Number(req.body.temperature);
    try {
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: generatePrompt(animal),
            temperature: temperature,
            max_tokens: 1024
          });
          
          const json_res = make_response(completion.data);

          res.status(200).json(json_res);

    } catch(err) {
            // Consider adjusting the error handling logic for your use case
        if (err.response) {
            console.error(err.response.status, err.response.data);
            res.status(err.response.status).json(err.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${err.message}`);
            res.status(500).json({ error: { message: 'An error occurred during your request.', }});
        }
    }
    
    function make_response (payload) {
        return {
            finish_reason: payload.choices[0].finish_reason,
            text:  payload.choices[0].text,
            usage: payload.usage
        }
    }

    function generatePrompt(animal) {
        const capitalizedAnimal =
          animal[0].toUpperCase() + animal.slice(1).toLowerCase();
        return `Suggest three names for an animal that is a superhero.
                Animal: Cat
                Names: Captain Sharpclaw, Agent Fluffball, The Incredible Feline
                Animal: Dog
                Names: Ruff the Protector, Wonder Canine, Sir Barks-a-Lot
                Animal: ${capitalizedAnimal}
                Names:`;
    }
   
});

app.post('/post_chat_completion', [cors(corsOptionsDelegate)], async (req, res) => {
    
    const temperature = Number(req.body.temperature);
    const chat_history = [...req.body.chat_history];
    //const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const full_path_txt = path.join(__dirname, '../', 'series_smaller2.txt');
    let json_res = {};
    try {
        if(process.env.NODE_ENV !== "ci") {
            const all_series = await fsPromises.readFile(full_path_txt, "utf8");
            chat_history[1].content += " " + all_series;
            chat_history[1].content = chat_history[1].content.replaceAll("\n", "");
            const hrstart = process.hrtime();
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                temperature: temperature,
                messages: req.body.chat_history
            });
            
            const hrend = process.hrtime(hrstart);
            const processing = format_processing_time(hrend); 
            json_res = make_response2(completion.data, processing);

            res.status(200).json(json_res);
        } else {
            setTimeout(() => { 
                json_res = make_fake_response();
                res.status(200).json(json_res);
            }, 2000);
        }
    } catch(err) {
            // Consider adjusting the error handling logic for your use case
        if (err.response) {
            console.error(err.response.status, err.response.data);
            res.status(err.response.status).json(err.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${err.message}`);
            res.status(500).json({ error: { message: 'An error occurred during your request.', }});
        }
    }

    function make_response2 (payload, processing) {
        return {
            finish_reason: payload.choices[0].finish_reason,
            text:  payload.choices[0].message.content,
            usage: payload.usage,
            env: "prod/dev",
            duration: processing
        };
    }

    function make_fake_response () {
        return {
            finish_reason: "stop",
            text:  "WW2 in color, The Handmaid's Tale",
            usage: { prompt_tokens: 100, completion_tokens: 15, total_tokens: 115 },
            env: "ci",
            duration: "0.1 Seconds"
        };
    }

    function format_processing_time(hrend){
        const measurement = "Seconds";
        let secs = hrend[0];
        let remainder_milli_secs = Math.floor(hrend[1]/1000000);
        let result = Number(`${secs}.${remainder_milli_secs}`);
        return `${result} ${measurement}`;
    }
   
});

app.post('/post_chat_completion_next', [cors(corsOptionsDelegate)], async (req, res) => {
    let json_res = {};
    const temperature = Number(req.body.temperature);
    const few_series = join_array_with_comma(req.body.few_user_series);
    const few_moods = join_array_with_comma(req.body.user_moods);
    
    const chat_history = [{ 
            "role": "system", 
            "content": "You are a helpful assistant that specializes in recommending TV series to viewers."
        }, 
        { 
            "role": "user", 
            "content": `I've seen and enjoyed the following TV series: ${few_series}. Currently i'm feeling: ${few_moods}.
            1. Please recommend me two OTHER tv series that I might also like AND might suit my mood.
            2. For each series recommendation do not specify the series plot.
            3. For each series recommendation explain its reason.
            4. Recommend series ONLY from the following list: `
        }
    ];

    chat_history[1].content = chat_history[1].content.replaceAll("\n", "");

    try {
        if(process.env.NODE_ENV !== "ci") {
            const full_path_txt = path.join(__dirname, '../', 'series_smaller2.txt');
            const all_series = await fsPromises.readFile(full_path_txt, "utf8");
            
            chat_history[1].content += " " + all_series;
            const hrstart = process.hrtime();
            
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                temperature: temperature,
                messages: chat_history
            });
            
            const hrend = process.hrtime(hrstart);
            const processing = format_processing_time(hrend); 
            json_res = make_response2(completion.data, processing);

            res.status(200).json(json_res);
        } else {
            setTimeout(() => { 
                json_res = make_fake_response();
                res.status(200).json(json_res);
            }, 2000);
        }
    } catch(err) {
            // Consider adjusting the error handling logic for your use case
        if (err.response) {
            console.error(err.response.status, err.response.data);
            res.status(err.response.status).json(err.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${err.message}`);
            res.status(500).json({ error: { message: 'An error occurred during your request.', }});
        }
    }

    function make_response2 (payload, processing) {
        return {
            finish_reason: payload.choices[0].finish_reason,
            text:  payload.choices[0].message.content,
            usage: payload.usage,
            env: "prod/dev",
            duration: processing
        };
    }

    function make_fake_response () {
        return {
            finish_reason: "stop",
            text:  "WW2 in color, The Handmaid's Tale",
            usage: { prompt_tokens: 100, completion_tokens: 15, total_tokens: 115 },
            env: "ci",
            duration: "0.1 Seconds"
        };
    }

    function format_processing_time(hrend){
        const measurement = "Seconds";
        let secs = hrend[0];
        let remainder_milli_secs = Math.floor(hrend[1]/1000000);
        let result = Number(`${secs}.${remainder_milli_secs}`);
        return `${result} ${measurement}`;
    }

    function join_array_with_comma(array) {
        let result = "";
        array.forEach((item, index, arr) => {
            if(index === 0) result += item;
            else if(index === arr.length-1) result += ` and ${item}`;
            else result += `, ${item}`;
        });

        return result;
    }
   
});

app.post('/post_image_generation', [cors(corsOptionsDelegate)], async (req, res) => {
    
    const prompt = req.body.prompt;

    try {
        const response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: "512x512",
            response_format: "url"
          });

        const image_url = response.data.data[0].url;
          
        res.status(200).json({url: image_url});

    } catch(err) {
            // Consider adjusting the error handling logic for your use case
        res.status(500).json({ error: { message: err.response.data.error.message }});
        
    }
   
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}.`); 
});