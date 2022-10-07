from django.core.urlresolvers import reverse
from rest_framework import viewsets, status
from rest_framework.decorators import list_route
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework_csv.parsers import CSVParser
from rest_framework_csv.renderers import CSVRenderer
from admet.serializers import SmilesSerializer
from admet.models import Smiles
from functions import handle_uploaded_file


class SmilesViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows talks to be viewed or edited.
    """
    queryset = Smiles.objects.all()
    parser_classes = (CSVParser,) + tuple(api_settings.DEFAULT_PARSER_CLASSES)
    renderer_classes = (CSVRenderer,) + tuple(api_settings.DEFAULT_RENDERER_CLASSES)
    serializer_class = SmilesSerializer

    def get_renderer_context(self):
        context = super(SmilesViewSet, self).get_renderer_context()
        context['header'] = (
            self.request.GET['fields'].split(',')
            if 'fields' in self.request.GET else None)
        return context

    @list_route(methods=['POST'])
    def df_upload(self, request, *args, **kwargs):
        return Response(handle_uploaded_file(request.data))
        