from flask import Flask, request,jsonify, render_template
import json, time
import csv
import os
import pandas as pd
from twilio.rest import Client

from flask_cors import CORS

app = Flask(__name__, template_folder='template')
CORS(app)
in_csv = 'other.csv'
out_csv = 'new_data.csv'
messages = []

#Description: route to call homepage of website 
#Pre: 
#Post: renders home page html
@app.route('/', methods=["GET", "POST"])
def base():
    return render_template('base.html')

#Description: call graph page test func
#Pre: 
#Post: renders graph html page with given values
@app.route('/graph', methods=["GET", "POST"])
def graph():
    return render_template('graph_orginal.html',values=[1,2,4,5,7],names=['x','y','s'])

#Description: Send sms to given mobile number (it should be activated with twilio before receiving message)
#Pre: auth tokens
#Post: send sms and return empty string
@app.route('/sms', methods=['POST'])
def sms():
    account_sid = 'AC19dd3735ece1bd2e811f05d98f826740'
    authtoken = '0395c38168d084463d3b8e468c3ede60'
    client = Client(account_sid, authtoken)

    jsdata = request.get_json()
    message = client.messages.create(
                                body=jsdata["body"],
                                from_=jsdata["from"],
                                to=jsdata["to"]
                                )
    return ""

#Description: read csv file
#Pre: 
#Post: return the recent one from given file
@app.route("/getdata", methods=["GET"])
def read_csv():
    if len(messages) < 1:
        return jsonify({'MESSAGE': "", 'SENDER_ID': "", 'FULL_CONV':"[]"})
    return messages.pop()
 
#Description: append jsonified data to a global variable for further use
#Pre:  
#Post: return empty string
@app.route("/savedata", methods=["POST"])
def get_msg_id():
    jsdata = json.loads(request.get_json())
    messages.append(jsonify({'MESSAGE': jsdata["msg"], 'SENDER_ID': jsdata["id"], 'FULL_CONV':jsdata["all_msg"]}))
    return ""

#Description: Update csv with given values x is marked at given column name
#Pre: 
#Post: write output to csv with marked cells
@app.route("/senddata", methods=["POST"])
def update_csv():
    jsdata = request.get_json()
    output = jsdata["msg"] + ','
    if jsdata["yes"] == 'x': output += 'x,'
    else: output +=','
    if jsdata["no"] == 'x': output += 'x,'
    else: output +=','
    if jsdata["ask_location"] == 'x': output += 'x,'
    else: output +=','
    if jsdata["ask_schedule"] == 'x': output += 'x,'
    else: output +=','
    if jsdata["ask_position"] == 'x': output += 'x,'
    else: output +=','
    if jsdata["ask_wage"] == 'x': output += 'x,'
    else: output +=','
    if jsdata["other"] == 'x': output += 'x,'
    else: output +=','
    output += '\n'
    with open(out_csv, 'a') as f:
        f.write(output)
    return ""

#Description: get count of rows in both csv's infile and outfile and training file
#Pre: 
#Post: return count and lables for graphs
def rows_csv():
    in_rows = 0
    out_rows = 0
    
    with open(in_csv, 'r') as f:
        in_rows = len(f.readlines())    
        
    with  open(out_csv, 'r') as f:
        out_rows = len(f.readlines())

    with  open('new_data.csv', 'r') as f:
        train_file = len(f.readlines())

    rows = [in_rows, out_rows, train_file] 
    lables = ['left','solved','trained']
    return rows,lables

#Description: pass values with column names as lables and 
              # to a template which uses chartjs cell count of each cell in a column

#Pre: 
#Post: return rendered template with values and lables for both graphs
@app.route("/classify/stats")
def csv_answered_data():
    response = {'yes':0,
                'no':0,
                'ask_location':0,
                'ask_schedule':0,
                'ask_position':0,
                'ask_wage':0,
                'other':0}
    keys = list(response.keys())
    data = pd.read_csv('new_data.csv')
    for _ in data.values.tolist():
        for i,val in enumerate(_):
            if val == 'x':
                response[keys[i-1]] += 1
    vals,labl =  rows_csv()
    return render_template('graph_orginal.html',values = list(response.values()),
                                                names = list(response.keys()),
                                                file_values = vals,
                                                file_names = labl )


#initiates server
if __name__ == '__main__':
   app.run(debug = True)
