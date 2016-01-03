#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Created on Fri Dec 18 20:45:45 2015

@author: Koen
"""
import re
import datetime

def createCSVs(infile, outpath):
    SQLtable2CSV(infile, outpath, 'users', ["id","status","name","fullname","birthday","PictureFile","login","password","accountrole","letscode","minlimit","maxlimit"])
    SQLtable2CSV(infile, outpath, 'messages', ["id","id_user","content","Description","amount","units","msg_type","id_category","cdate","mdate","validity"])
    SQLtable2CSV(infile, outpath, 'transactions', ["id","id_from","id_to","amount","description"])
    SQLtable2CSV(infile, outpath, 'contact', ["id","id_type_contact","value","flag_public","id_user"])
    
    print('Hope this works too.')
    
    
def SQLtable2CSV(sqlfile, outpath, tablename, fields, separator = ','):
    datestr = str(datetime.datetime.now())[0:10]
    with open(sqlfile, 'r') as fin:
        fullsql = fin.read()
        #print(fullsql[1:100])
    tabledef = re.findall('COPY ' + tablename + ' .*?(?:\n\\\.)', fullsql, re.M|re.DOTALL)
    if len(tabledef) == 0:
        tabledef = re.findall('COPY "' + tablename + '" .*?(?:\n\\\.)', fullsql, re.M|re.DOTALL)
        if len(tabledef) == 0:
            print('table "' + tablename + '" not found. \nSkip this.')
            return
    if len(tabledef) > 1:
        print('more than 1 table "' + tablename + '" found. \nSkip this.') 
        return
    tabledef = tabledef[0]
    fielddef = tabledef[tabledef.find('(') : tabledef.find(')')+1]
    #print('fielddef:')
    #print(fielddef)
    for field in fields:
        if fielddef.find(field) == -1:
            print('field "' + field + '" not found in definition of "' + tablename + '". \nSkip this.')
            return
    fieldpattern = re.sub('"?, "?', '>[^\t\n]*)\t(?P<', fielddef)
    #print('fieldpattern:')
    #print(fieldpattern)
    fieldpattern = re.sub('"?[)]$', '>[^\t\n]*).*\n', fieldpattern)
    fieldpattern = re.sub('^[(]"?', '(?P<', fieldpattern)
    #print('fieldpattern:')
    #print(fieldpattern)
    fieldrepl = ''
    for field in fields:
        fieldrepl += '"\g<' + field + '>"' + separator
    fieldrepl = fieldrepl[:-1*len(separator)] + '\n'
    #print('fieldrepl:')
    #print(fieldrepl)
    
    with open(outpath + tablename + '__' +datestr+'.csv','w') as fout:
        firstline = ''
        for field in fields:
            firstline += '"' + field + '"' + separator
        fout.write(firstline[:-1*len(separator)] + '\n')
        
        table = tabledef[tabledef.find('\n')+1:]
        
        csvdata = re.sub(fieldpattern, fieldrepl, table)
        #print(csvdata)
        fout.write(csvdata[:-3])
            
            
            

if __name__ == "__main__":
    import sys
    if len(sys.argv) == 1:
        print('No operation requested, try -help to get more info.')
    else:
        try:
            if sys.argv[1] == 'createCSV':
                if len(sys.argv) < 3:
                    infile = "C:\\Users\\Koen\\Documents\\Private\\lets\\elasmechelen-dml.sql"
                    outpath = "C:\\Users\\Koen\\Documents\\Private\\lets\\"
                elif len(sys.argv) < 4:
                    infile = sys.argv[2]
                    outpath = r"C:\\Users\\Koen\\Documents\\Private\\lets\\"
                else:
                    infile = sys.argv[2]
                    outpath = sys.argv[3]
                createCSVs(infile, outpath)
            elif sys.argv[1] == '-help':
                print('[PYTHONPATH]python.exe spice.py ')
                print('Available arguments:')
                print('  creatCSV infile outpath')
                print('    Creates a CSV file for use in ELAS 2 inner conversion')
                print('                                        T:\\projectname\\lvs\\cellname.sp')
            else:
                print('Unknown arguments for this module: ' + repr(sys.argv))
        except:
            print('Arguments for this module causing an error: ' + repr(sys.argv))
            print('')
            raise
    
