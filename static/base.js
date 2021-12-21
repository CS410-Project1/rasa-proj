// base strings for REST calls
const RASA_URL = "http://localhost:5005/conversations/";
const FLASK_URL = "http://127.0.0.1:5000";

// global state
var data = {};
var grab_new = true;
const INTRO_MESSAGE = "Hello this is McDonalds from Washington Street, you worked for us before, would you like to come back?";

// FUNCTIONS CALLED IN HTML FILE

// PRE:  A set of phone numbers with area and nation codes delimited by whitespace or commas
//       have been entered in the phone-text-area text box
// POST: The phone numbers are sent the INTRO_MESSAGE using twillio
const masstext = async() => {
    let numbers = get_phone_numbers();

    for(let i = 0; i < numbers.length; i++) {
        send_sms(INTRO_MESSAGE, numbers[i]);
    }
}

// PRE:  
// POST: Returns the next thruple of (MSG, SENDER_ID, FULL_CONV) from the flask api
const getData = async() => {
    return await fetch(FLASK_URL + "/getdata", {
	      method: "GET",
	      headers: new Headers({"Access-Control-Allow-Origin" : "*"})})
        .then(function (response) { return response.text();})
        .then((text) => {return text;});
}

// PRE:  apiData field must text in it
// POST: Calls the flask api method "/sms" with the value in the apiData field
const sendresponse = async() => {
    let resp = grab_reset_field_by_id("apiData");
    // send sms
    send_sms(resp, data["SENDER_ID"]);
    
    // display bot response in the text area
    display_bot_text(resp);

}

// PRE:  
// POST: loops on 3 second timer for new user mesages from rasa
const updatechat = async(msg) => {
    while(grab_new == false) {
        // holds code execution for 3 seconds
	      for (let i = 0; i < 5; i++) {
	          if (i === 3)
		            await sleep(2000);
	      }

        // updates data global variable if tracker has texts from the user
        let tracker = get_tracker(data["SENDER_ID"]);
	      if (tracker["sender_id"] != "default" && tracker["latest_message"]["text"] != data["MESSAGE"]) {
            // update latest user message
	          data["MESSAGE"] = tracker["latest_message"]["text"];

            // add message to text screen and question box
            display_user_text(data["MESSAGE"]);
            update_user_question(data["MESSAGE"]);
	      }
    }
}


// PRE:    
// POST: loops till a new user is detected and then chat logs are displayed
const updatequestion = async() =>  {
    if(grab_new) {
	      data = await getData(data["SENDER_ID"]);
	      data = JSON.parse(data);
	      latestmsg = data["MESSAGE"]

        // loops till data is updated with a new SENDER_ID
	      while(data["SENDER_ID"] == "") {
	          data = await getData()
	          data = JSON.parse(data)

            // sleep for 3 seconds
	          for (let i = 0; i < 5; i++) {
		            if (i === 3)
		                await sleep(2000);
	          }
	      }
    }

    // start polling for updates
    if(grab_new) {
	      // poll for user responses
	      grab_new = false;
	      updatechat();
    }

    update_user_question(data["MESSAGE"]);
    clear_chat();
    display_full_conv();
}

// PRE:  
// POST: displays bot response in text field and updates csv with the
//       classification of the user intent
const updateresponse = async() => {
    let response_dict = get_response_dict();
    let intent_dict = get_intent_dict();
    let resp = "";

    // appends to response for every question selected
    for (let q in intent_dict) {
        if (document.getElementById(q).checked) {
            intent_dict[q] = "x";
	          document.getElementById(q).checked = false;
            resp += response_dict[q];
        }
    }
    resp += "Are you interested?";

    // overwrites response if yes or no was selected (yes trumps no)
    if (intent_dict["no"] == "x") {
	      resp = response_dict["no"];
    } else if (intent_dict["yes"] == "x") {
	      resp = response_dict["yes"];
    }

    // sends sms if intent is not classifed as other
    if (intent_dict["other"] == "") {
        send_sms(resp, data["SENDER_ID"]);
	      display_bot_text(resp);
    }

    // writes selected intents to csv
    update_csv(data_dict);
}

// PRE:  
// POST: deletes all session data on page and tells rasa it can resume conversation
//       with the client
const resumerasa = async () => {
    await fetch(RASA_URL + data["SENDER_ID"] + "/execute", {
        method: "POST",
        body: '{"event":"action", "name": "action_restart"}',
        headers: {
            "content-type": "application/json",
        }, "mode" : "no-cors"
    });
    clear_chat();
    update_user_question("");
    reset_data();
    grab_new = true;
    updatequestion();
}



// UTILITY FUNCTIONS

// PRE:  msg must be a string
// POST: displays a text msg in the bot side of the text screen
function display_bot_text(msg) {
    let text = '<div class="chat-messages"><div class="chat-message-right pb-4 justify-content-start"><div></div><div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3"><div class="font-weight-bold mb-1">You</div>'
    text += msg;
    text += "</div></div>"
    document.getElementById("chat-history").innerHTML += text;
    updatechat();

}

// PRE:  msg must be a string
// POST: displays a text msg in the user side of the text screen
function display_user_text(msg) {
    let text = '<div class="chat-messages"><div class="chat-message-left pb-4 justify-content-end"><div></div><div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3"><div class="font-weight-bold mb-1">'
    text += data["SENDER_ID"]
    text += "</div>"
    text += msg;
    text += "</div></div>"
    document.getElementById("chat-history").innerHTML += text;
}

// PRE:  msg must be a string
// POST: writes msg to the question field of the web page
function update_user_question(msg) {    
	  document.getElementById("question").innerHTML = '<strong>Question</strong>:- ' + msg;
}

// PRE:  A number of miliseconds
// POST: The calling function will sleep for that amount of time
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// PRE:  A string containing a message, a number to send an sms to
// POST: The messag is sent to the number using twillio number
function send_sms(msg, number) {
	  let resp = await fetch(FLASK_URL + "/sms", {
        method: "POST",
        body: JSON.stringify({"body": msg,
				                      "from": "+17813324437",
				                      "to": numbers[i]}),
        headers: new Headers({
		        "content-type": "application/json",
		        "Access-Control-Allow-Origin": "*"
        })
	  });
    return resp;
}

// PRE:
// POST: The chat area of the webpage is cleared
function clear_chat() {
    document.getElementById("chat-history").innerHTML = "";
}

// PRE:  
// POST: calls the /senddata api call with data_dict cast to a JSON object
function update_csv(data_dict) {
    fetch(FLASK_URL + "/senddata", {
        method: "POST",
        body: JSON.stringify({"msg":data["MESSAGE"],
                              "yes": data_dict["ask_location"],
                              "no":  data_dict["no"],
                              "ask_location": data_dict["ask_location"],
                              "ask_schedule": data_dict["ask_schedule"],
                              "ask_position": data_dict["ask_position"],
                              "ask_wage": data_dict["ask_wage"],
                              "other": data_dict["other"]}),
        headers: new Headers({
            "content-type": "application/json"
        })
    });
}

// PRE:  
// POST: the data global variable is reset to its default values
function reset_data() {
    data = {'MESSAGE': "", 'SENDER_ID': "", 'FULL_CONV':"[]"};
}

// PRE:  
// POST: 
function grab_reset_field_by_id(id) {
    let val = document.getElementById(id).value
    document.getElementById(id).value = document.getElementById(id).defaultValue;
    return val;
}

// PRE:  numbers in phone text area field must be delimited by whitespace or commas
//       the numbers must also be of the form 12223334444 or +12223334444
// POST: returns a list of phone numbers in the phone text area field (or empty list)
function get_phone_numbers() {
    return grab_reset_field_by_id("phone-text-area").split(/[ ,\\r\\n]+/);
}

// PRE:  data global variable must have been initialized
// POST: displays all entries in the data[FULL_CONV] in the sms display
function display_full_conv() {
    display_bot_text(INTRO_MESSAGE);
    for(let i = 0; i < data["FULL_CONV"].length; i++) {
	      if(data["FULL_CONV"][i][0] == "bot") {
	          display_bot_text(data["FULL_CONV"][i][1]);
	      } else if(data["FULL_CONV"][i][0] == "user") {
	          display_user_text(data["FULL_CONV"][i][1]);
	      }
    }
}

// PRE:  
// POST: returns a dictionary of: intent: 'chatbot response' pairs
function get_response_dict() {
    return {"ask_location": "We have a few locations: Washington Street and School Street. ",
		        "ask_position": "We are hiring for general manager and cashier positions. ",
		        "ask_wage": "The wage is 18$ for manager, $15 for cashier. ",
		        "ask_schedule": "We are hiring for our midday and closing shifts. The postition has part time and full time openings. ",
		        "yes": "https://careers.mcdonalds.com/us-restaurants",
		        "no":  "",
            "other": ""
		}
}

// PRE:  
// POST: returns a dictionary of: intent, "" pairs
function get_intent_dict() {
    return {"ask_location": "",
		        "ask_position": "",
		        "ask_wage": "",
		        "ask_schedule": "",
		        "yes": "",
		        "no":  "",
            "other": ""
		}
}

// PRE:  number must be a valid phone number of the form +12223334444 or 12223334444
//       (RASA service must have a tracker associated with the number)
// POST: a tracker from Rasa that is associated with the number 
function get_tracker(number) {
	  let tracker = await fetch(RASA_URL + number + "/tracker", {
	      method: "GET",
	      headers: new Headers({
		        "Access-Control-Allow-Origin" : "*"
	      })
	  }).then(function(response) {
	      return response.json();
	  }).then(function(data) {
	      console.log(data);
	      return data;
	  });

    return tracker;
}
