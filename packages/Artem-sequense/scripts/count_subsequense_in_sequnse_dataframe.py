# exercise - Modifying dataframes with scripts
#name: CountSubsequencePythonDataframe
#language: python
#input: dataframe sequences
#input: column columnName
#input: string subsequence = "acc"
#output: dataframe result {action:join(sequences)}
import pandas as pd
sequences_column = sequences[columnName]
count = 0
subsequence = "a"
counts = list();
for i in range(len(sequences_column)):
    count = 0
    for j in range(len(sequences_column[i])):
        if sequences_column[i][j:j+len(subsequence)] == subsequence:
            count += 1
    counts.append(count);
result = pd.DataFrame({'N(s)': counts})

