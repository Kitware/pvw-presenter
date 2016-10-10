r"""
    This module is a ParaViewWeb server application.
    The following command line illustrates how to use it::

        $ pvpython -dr .../pvw-state-loader.py --state /.../path-to/state.pvsm

        --state
             Path used to load a state file.

    Any ParaViewWeb executable script comes with a set of standard arguments that can be overriden if need be::

        --port 8080
             Port number on which the HTTP server will listen.

        --content /path-to-web-content/
             Directory that you want to serve as static web content.
             By default, this variable is empty which means that we rely on another
             server to deliver the static content and the current process only
             focuses on the WebSocket connectivity of clients.

        --authKey vtkweb-secret
             Secret key that should be provided by the client to allow it to make
             any WebSocket communication. The client will assume if none is given
             that the server expects "vtkweb-secret" as secret key.

"""

# import to process args
import os

# import paraview modules.
from paraview.web import wamp      as pv_wamp
from paraview.web import protocols as pv_protocols

# import RPC annotation
from autobahn.wamp import register as exportRpc

from paraview import simple
from vtk.web import server

try:
    import argparse
except ImportError:
    # since  Python 2.6 and earlier don't have argparse, we simply provide
    # the source for the same as _argparse and we use it instead.
    from vtk.util import _argparse as argparse

# =============================================================================
# Create custom Pipeline Manager class to handle clients requests
# =============================================================================

class _StateLoaderServer(pv_wamp.PVServerProtocol):

    stateToLoad = None
    authKey = "vtkweb-secret"

    @staticmethod
    def add_arguments(parser):
        parser.add_argument("--state", default=None, help="State file to load", dest="state")

    @staticmethod
    def configure(args):
        _StateLoaderServer.authKey     = args.authKey
        _StateLoaderServer.stateToLoad = args.state

    def initialize(self):
        # Load state
        simple.LoadState(_StateLoaderServer.stateToLoad)
        view = simple.Render()

        # Capture camera information
        self.cameraPosition = tuple(view.CameraPosition)
        self.cameraViewUp = tuple(view.CameraViewUp)
        self.cameraFocalPoint = tuple(view.CameraFocalPoint)

        # Bring used components
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebMouseHandler())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPort())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPortImageDelivery())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPortGeometryDelivery())

        # Update authentication key to use
        self.updateSecret(_StateLoaderServer.authKey)

        # Disable interactor-based render calls
        view.EnableRenderOnInteraction = 0

        # Update interaction mode
        pxm = simple.servermanager.ProxyManager()
        interactionProxy = pxm.GetProxy('settings', 'RenderViewInteractionSettings')
        interactionProxy.Camera3DManipulators = ['Rotate', 'Pan', 'Zoom', 'Pan', 'Roll', 'Pan', 'Zoom', 'Rotate', 'Zoom']

    @exportRpc("state.resetcamera")
    def resetCamera(self):
      view = simple.GetActiveView()
      view.CameraPosition = self.cameraPosition
      view.CameraViewUp = self.cameraViewUp
      view.CameraFocalPoint = self.cameraFocalPoint
      simple.Render(view)
      self.getApplication().InvokeEvent('PushRender')

# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="ParaView Web State Loader")

    # Add arguments
    server.add_arguments(parser)
    _StateLoaderServer.add_arguments(parser)
    args = parser.parse_args()
    _StateLoaderServer.configure(args)

    # Start server
    server.start_webserver(options=args, protocol=_StateLoaderServer)
