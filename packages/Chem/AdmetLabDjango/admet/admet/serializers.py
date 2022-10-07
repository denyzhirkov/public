from rest_framework import serializers
from admet.models import Smiles


class SmilesSerializer (serializers.ModelSerializer):
    class Meta:
        model = Smiles
        fields = ('smiles', 'numerical_data')
