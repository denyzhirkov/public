import numpy as np
import matplotlib.pyplot as plt

from itertools import product


def computeFrequencesOfTriplets(s, series):
    """
    Computes frequences of all triplets in the string s
    s - string
    series - a dictionary: key -triplet, value - frequency.
    """
    """for startingIndex in range(3):
        firstIndex = startingIndex
        lastIndex = firstIndex + 3
        while(lastIndex <= len(s)):
            triplet = s[firstIndex:lastIndex]
            series[triplet] += 1
            firstIndex += 3
            lastIndex += 3"""
    firstIndex = 0
    lastIndex = firstIndex + 3
    while(lastIndex <= len(s)):
        triplet = s[firstIndex:lastIndex]
        series[triplet] += 1
        firstIndex += 1
        lastIndex += 1

sizeOfFont = 5

correctSymbols = 'ACGT'

allPossibleTriplets = [''.join(element) for element in product(correctSymbols, correctSymbols, correctSymbols)]

print(allPossibleTriplets)

tripletSeries = {element: 0 for element in allPossibleTriplets}
print(tripletSeries)


s = "AAAATTTTCCCCGGGG"
print(s)
            
computeFrequencesOfTriplets(s, tripletSeries)

print(tripletSeries)

s = "TTTTCCCCGGGGAAAA"
print(s)

computeFrequencesOfTriplets(s, tripletSeries)

print(tripletSeries)

y = np.arange(len(tripletSeries))
x = np.array(list(tripletSeries.values()))
aminoAcidsLlabels = list(tripletSeries)

fig, ax = plt.subplots()

ax.barh(y, x, align='center')
ax.set_yticks(y, labels=aminoAcidsLlabels, fontsize=sizeOfFont)
ax.invert_yaxis()  # labels read top-to-bottom
ax.set_xlabel('Number of amino acids')

plt.show()


"""for startingIndex in range(3):
    firstIndex = startingIndex
    lastIndex = firstIndex + 3

    while(lastIndex <= len(s)):
        triplet = s[firstIndex:lastIndex]
        print(triplet)
        #tripletSeries[triplet] += 1
        firstIndex += 3
        lastIndex += 3

    print()"""


"""for key in tripletSeries.keys():
    tripletSeries[key] += s.count(key) + s.count(key, 1) + s.count(key, 2)
    print(f'{key}: {tripletSeries[key]}')

s1 = s.upper()
print(s1)

s2 = s.replace(' ', '').upper()
print(s2)

s3 = "ABABABABABA"

print(s3.count("ABA"))
print(s3.count("ABA", 1))
print(s3.count("ABA", 2))"""

