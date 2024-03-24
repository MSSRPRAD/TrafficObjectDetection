import io
from flask import Flask, request, jsonify, send_file, Response
import os
import matplotlib.pyplot as plt
import torchvision
import torch
import tempfile
import matplotlib.pyplot as plt
from torchvision.utils import draw_bounding_boxes, draw_segmentation_masks
from torchvision.io import read_image
from torchvision.transforms import v2 as T
from flask_cors import CORS
import base64
import json

app = Flask(__name__)
CORS(app)

def get_transform(train):
    transforms = []
    if train:
        transforms.append(T.RandomHorizontalFlip(0.5))
    transforms.append(T.ToDtype(torch.float, scale=True))
    transforms.append(T.ToPureTensor())
    return T.Compose(transforms)

model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights="DEFAULT")
COCO_INSTANCE_CATEGORY_NAMES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
    'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack', 'umbrella', 'N/A', 'N/A',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'N/A', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
    'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table',
    'N/A', 'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'N/A', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

@app.route('/detect', methods=['POST'])
def detect():
    image_file = request.files['image']
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
        temp_file.write(image_file.read())
        temp_file_path = temp_file.name

    image = read_image(temp_file_path)
    eval_transform = get_transform(train=False)

    model.eval()
    with torch.no_grad():
        x = eval_transform(image)
        # convert RGBA -> RGB and move to device
        x = x[:3, ...]
        predictions = model([x, ])
        pred = predictions[0]
    image = (255.0 * (image - image.min()) / (image.max() - image.min())).to(torch.uint8)
    image = image[:3, ...]
    pred_labels = [f"{COCO_INSTANCE_CATEGORY_NAMES[label]}: {score:.3f}" for label, score in zip(pred["labels"], pred["scores"])]
    counts = {}
    for label in COCO_INSTANCE_CATEGORY_NAMES:
        counts[label] = 0
    for label in COCO_INSTANCE_CATEGORY_NAMES:
        for label, score in zip(pred["labels"], pred["scores"]):
            counts[COCO_INSTANCE_CATEGORY_NAMES[label]] += 1
    pred_boxes = pred["boxes"].long()
    output_image = draw_bounding_boxes(image, pred_boxes, pred_labels, colors="red")
    plt.imsave("foo.png", output_image.permute(1, 2, 0).numpy())
    os.unlink(temp_file_path)
    plt.figure(figsize=(12, 12))
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
        temp_file_path = temp_file.name
        plt.imsave(temp_file_path, output_image.permute(1, 2, 0).numpy())
        print(temp_file_path)
        print("reached here!")
    resp = send_file(temp_file_path, mimetype='image/png')
    resp.headers['x-count'] = json.dumps(counts)
    resp.headers['Access-Control-Expose-Headers'] = 'content-length, authorization, x-count'
    return resp

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)