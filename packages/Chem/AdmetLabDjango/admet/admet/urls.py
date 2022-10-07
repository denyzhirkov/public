"""admet URL Configuration"""

from django.conf.urls import url, include
from django.contrib import admin
from rest_framework import routers
from admet import views

router = routers.DefaultRouter()
router.register(r'smiles', views.SmilesViewSet)

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^admin/', admin.site.urls),
]
