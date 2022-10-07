from django.db import models


class Smiles (models.Model):
    smiles = models.TextField()
    numerical_data = models.TextField()
