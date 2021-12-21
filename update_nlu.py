import csv
import string

affirm = []
deny = []
ask_location = []
ask_schedule = []
ask_position = []
ask_wage = []
ask_wage_schedule = []
other = []

def read_csv(filename):
    with open(filename, 'r') as csvfile:
        csvreader = csv.reader(csvfile)
        #next(csvreader)
        for row in csvreader:
            if row[0]:
                if row[1]:
                    affirm.append(row[0])
                elif row[2]:
                    deny.append(row[0])
                elif row[4] and row[6]:
                    ask_wage_schedule.append(row[0])
                elif row[3]:
                    ask_location.append(row[0])
                elif row[4]:
                    ask_schedule.append(row[0])
                elif row[5]:
                    ask_position.append(row[0])
                else:
                    other.append(row[0])

def concat_csv(o_filename, n_filename):
    new = None
    with open(n_filename, 'r') as f1:
        new = f1.read()

    with open(o_filename, 'a') as f2:
        f2.write(new)

def clean_str(s):
    printable = set(string.printable)
    no_special = ''.join(filter(lambda x: x in printable, s))
    return no_special.replace('\n', ' ')

def write_intent(name, values, nlu):
    nlu.write('- intent: ' + name + '\n')
    nlu.write('  examples: |\n')
    for val in set(values):
        nlu.write('    - ' + clean_str(val) + '\n')

def write_nlu():
    with open("data/nlu.yml", 'w') as nlu:
        nlu.write('version: "3.0"\n')
        nlu.write('nlu:\n')
        write_intent("affirm", affirm, nlu)
        nlu.write('\n')
        write_intent("deny", ask_location, nlu)
        nlu.write('\n')
        write_intent("ask_location", ask_location, nlu)
        nlu.write('\n')
        write_intent("ask_schedule", ask_schedule, nlu)
        nlu.write('\n')
        write_intent("ask_position", ask_position, nlu)
        nlu.write('\n')
        write_intent("ask_wage", ask_wage, nlu)
        nlu.write('\n')
        write_intent("ask_wage_schedule", ask_wage_schedule, nlu)

concat_csv("data.csv", "locations.csv")
concat_csv("data.csv", "schedule.csv")
concat_csv("data.csv", "positions.csv")
concat_csv("data.csv", "Sheet1.csv")
read_csv("data.csv")
write_nlu()
