#name: Histogram
#language: python
#tags: demo, viewers
#input: dataframe sequences
#input: int sizeOfFont=6
#input: column columnName
#output: graphics

import itertools
import numpy as np
import matplotlib.pyplot as plt

def computeFrequencesOfTriplets(s, series):
    """
    Computes frequences of all triplets in the string s
    s - string
    series - a dictionary: key -triplet, value - frequency.
    """
    firstIndex = 0
    lastIndex = firstIndex + 3
    while(lastIndex <= len(s)):
        triplet = s[firstIndex:lastIndex]
        series[triplet] += 1
        firstIndex += 1
        lastIndex += 1

correctSymbols = 'ACGT' 

# creation of all possible triplets of symbols A,B,C,D
allPossibleTriplets = [''.join(element) for element in itertools.product(correctSymbols, correctSymbols, correctSymbols)]

# a dictionary: key is a triplet, value is a frequency
tripletSeries = {element: 0 for element in allPossibleTriplets}        

numOfString = sequences[columnName].size

# processing of all strings in the input column
for seq in sequences[columnName]:
    computeFrequencesOfTriplets(seq.replace(" ", '').upper(), tripletSeries)

# histogram creation
y = np.arange(len(tripletSeries))
x = np.array(list(tripletSeries.values()))
aminoAcidsLlabels = list(tripletSeries)

fig, ax = plt.subplots()

ax.barh(y, x, align='center')
#ax.set_yticks(y, labels=aminoAcidsLlabels, fontsize=sizeOfFont)
ax.invert_yaxis()  # labels read top-to-bottom
ax.set_xlabel('Number of amino acids')
ax.set_title('Histogram: distribution of amino acids')

plt.show()
