# name: CountSubsequencePythonDataframe
# language: python
# input: dataframe sequences
# input: column columnName
# input: string subsequence = "acc"
# output: dataframe result {action:join(sequences)}
result = pd.DataFrame()
result["N("+subsequence+")"] = sequences[columnName].str.count(subsequence)