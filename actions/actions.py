# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

from typing import Dict, Text, List, Any
from flask import jsonify

from rasa_sdk import Tracker
from rasa_sdk.events import EventType, ConversationPaused
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk import Action

import requests, json
response = requests.get

SHARED_FILE = "other.csv"
FLASK_API = "http://localhost:5000"

# Description: this function will be called after rasa finds an intent it cannot classify
#              when this happens, the conversation in rasa is paused and the session information
#              is sent to the flask api

class ActionPauseWriteCSV(Action):
    def name(self) -> Text:
        return "action_pause_write_csv"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        all_events = tracker.events_after_latest_restart()
        all_data = []
        for e in all_events:
            if "text" in e:
                all_data.append([e["event"], e["text"]])
        
        response = requests.post(FLASK_API + '/savedata',
                                 json = json.dumps({'msg': (tracker.latest_message)["text"],
                                                    'id': tracker.sender_id,
                                                    'all_msg': all_data}))
        print(response.status_code)
        return [ConversationPaused()]
