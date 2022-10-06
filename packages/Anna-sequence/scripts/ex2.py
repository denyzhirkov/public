# 2.1

#name: CountSubsequencePython
#language: python
#input: string sequence
#input: string subsequence
#output: int count
count = sequence.count(subsequence)


# 2.2

#name: CountSubsequencePythonDataframe
#language: python
#input: dataframe sequences
#input: column columnName
#input: string subsequence = "acc"
#output: dataframe result {action:join(sequences)}
result = sequences[columnName].apply(lambda x: x.count(subsequence))