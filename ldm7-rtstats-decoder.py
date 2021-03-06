import sys
import re
import pymongo
import datetime
import csv

'''
Copyright (C) 2018 University of Virginia. All rights reserved.

file      ldm7-rtstats-decoder.py
author    Ying Lin
version   3.0
date      Apr. 4, 2019

brief     parses log files generated by LDM7 receivers on a specified
          aggregate size basis.
usage     python ldm7-rtstats-decoder.py <logfile> <csvfile-to-write>
the file sent from receiver is aggregated data per min,
the thing mothership side need to do is read these data and write into db
'''
# connect to mongodb
connection = pymongo.MongoClient('127.0.0.1', 27017)
db = connection.dashboard
col = db.test

# read file
def readfile(filename):
    with open(filename, 'r') as infile:
        data = infile.readlines()
    return data

# insert data
def insertData(data, lastDate):
    if lastDate is None:
        lineZero = data[0].split(',')
        dateStrZero = lineZero[0][0:4]+'-'+lineZero[0][4:6]+'-'+lineZero[0][6:11]+':'+lineZero[0][11:13]+':'+lineZero[0][13:]
        dateZero = datetime.datetime.strptime(dateStrZero, "%Y-%m-%dT%H:%M:%SZ")
        lastDate = dateZero - datetime.timedelta(days=1)
    for d in data:
        line = d.split(',')
        # new version with flag
        if len(line) is 14:
            dateStr = line[0][0:4]+'-'+line[0][4:6]+'-'+line[0][6:11]+':'+line[0][11:13]+':'+line[0][13:]
            date = datetime.datetime.strptime(dateStr, "%Y-%m-%dT%H:%M:%SZ")
            if (date > lastDate):
                hostname = line[1]
                feedtype = line[2]
                completeSize = int(line[3])
                receivedSize = int(line[4])
                completeProd = int(line[5])
                receivedProd = int(line[6])
                aggregatedLatency = float(line[7])
                maxLatencySize = int(line[8])
                maxLatency = float(line[9])
                minThruSize = int(line[10])
                minThruLatency = float(line[11])
                percentile80Thru = float(line[12])
                negativeLatencyNum = int(line[13])

                if aggregatedLatency > 0:
                    avgThru = float(receivedSize*8 / aggregatedLatency)
                else:
                    avgThru = -1

                if minThruLatency > 0:
                    minThru = float(minThruSize*8 / minThruLatency)
                else:
                    minThru = -1

                if maxLatency > 0:
                    maxLatencyThru = float(maxLatencySize*8 / maxLatency)
                else:
                    maxLatencyThru = -1

                if completeProd > 0:
                    ffdr_num = float(receivedProd / completeProd) * 100
                else:
                    ffdr_num = -1

                if completeSize > 0:
                    ffdr_size = float(receivedSize / completeSize) * 100
                else:
                    ffdr_size = -1
                    
                if re.search(r'.*sdsc', hostname):
                    hostname = "ucsd"
                elif re.search(r'.*maxgigapop', hostname):
                    hostname = "umd"
                elif re.search(r'.*wisc', hostname):
                    hostname = "wisc"
                elif re.search(r'.*uva', hostname):
                    hostname = "uva"
                elif re.search(r'.*utah', hostname):
                    hostname = "Utah"
                elif re.search(r'.*washington', hostname):
                    hostname = "u.wash"
		elif re.search(r'.*missouri', hostname):
		    hostname = "missouri"

                col.insert({'date': date, 'completeSize': completeSize,
                        'receivedSize': receivedSize, 'aggregatedLatency': aggregatedLatency,
                        'completeProd': completeProd, 'receivedProd': receivedProd,
                        'maxLatencySize': maxLatencySize, 'maxLatency': maxLatency,
                        'minThruSize': minThruSize, 'minThruLatency': minThruLatency,
                        'avgThru': avgThru, 'minThru': minThru,
                        'maxLatencyThru': maxLatencyThru, 'percentile80Thru': percentile80Thru,
                        'ffdrProd': ffdr_num, 'ffdrSize': ffdr_size,
                        'feedtype': feedtype, 'hostname': hostname, 'negativeLatencyNum': negativeLatencyNum})
    print("finished")

def getLastId():
    last_doc = col.find_one({}, sort=[( "_id", pymongo.DESCENDING )])
    if last_doc is None:
        return None
    else:
        return last_doc[u'date']

def main(pqfile):
    data = readfile(pqfile)
    lastDate = getLastId()
    insertData(data, lastDate)
    connection.close()

if __name__ == "__main__":
    main("ldm7-rtstats.log")

