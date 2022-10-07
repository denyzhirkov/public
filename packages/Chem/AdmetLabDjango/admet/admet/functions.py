import joblib
import numpy as np
import pandas as pd
import csv
import os


def handle_uploaded_file(f):
    rows = []
    for row in f:  
        rows.append(list(row.values()))
    current_path = os.path.split(os.path.realpath(__file__))[0]
    cf = joblib.load(current_path+'/static/models/CYP3A4-substrate.pkl')
    fingerprint_content = pd.DataFrame(rows).iloc[:1, 2:]
    des_list = np.array(fingerprint_content)
    y_predict_label = cf.predict(des_list)
    y_predict_proba = cf.predict_proba(des_list)
    return y_predict_proba