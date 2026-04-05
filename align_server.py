import cv2
import numpy as np
import base64
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def get_face_anchors(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(100, 100))
    if len(faces) == 0:
        return None, img
    faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
    x, y, w, h = faces[0]
    anchors = [
        [x, y],
        [x + w, y]
    ]
    return np.array(anchors, dtype=np.float32), img

def align_image(target_anchors, source_anchors, source_img):
    if target_anchors is None or source_anchors is None:
        return source_img
    transform, _ = cv2.estimateAffinePartial2D(source_anchors, target_anchors)
    if transform is None:
        return source_img
    h, w, c = source_img.shape
    warped = cv2.warpAffine(source_img, transform, (w, h), borderMode=cv2.BORDER_REPLICATE)
    return warped

def base64_to_cv2(base64_string):
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def cv2_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img)
    return 'data:image/jpeg;base64,' + base64.b64encode(buffer).decode('utf-8')

class AlignHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        base_b64 = data.get('base')
        forms_b64 = data.get('forms', [])
        
        base_img = base64_to_cv2(base_b64)
        base_anchors, _ = get_face_anchors(base_img)
        
        aligned_forms = []
        for form_b64 in forms_b64:
            form_img = base64_to_cv2(form_b64)
            if base_anchors is not None:
                source_anchors, _ = get_face_anchors(form_img)
                if source_anchors is not None:
                    form_img = align_image(base_anchors, source_anchors, form_img)
            aligned_forms.append(cv2_to_base64(form_img))
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {'aligned': aligned_forms}
        self.wfile.write(json.dumps(response).encode('utf-8'))

def run(server_class=HTTPServer, handler_class=AlignHandler, port=5183):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting httpd on port {port}...')
    httpd.serve_forever()

if __name__ == "__main__":
    run()
