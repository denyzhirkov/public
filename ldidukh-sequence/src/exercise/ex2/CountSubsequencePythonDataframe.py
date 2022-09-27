# name: CountSubsequencePythonDataframe
# language: python
# input: dataframe sequences
# input: column columnName
# input: string subsequence = "acc"
# output: dataframe result {action:join(sequences)}
result = sequences[columnName].apply(lambda x: x.count(subsequence))
