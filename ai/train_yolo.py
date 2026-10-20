from ultralytics import YOLO

def train_classification_model():
    # Load the pre-trained Nano classification model
    model = YOLO('yolov8n-cls.pt')
    
    # Train the model on your local images directory
    # 15 epochs is brief enough for a rapid hackathon demo
    results = model.train(
        data='data/images', 
        epochs=15, 
        imgsz=224,
        name='civicpulse_cls_v1'
    )
    
    print("\nTraining completed successfully!")
    print("Custom weights are saved in runs/classify/civicpulse_cls_v1/weights/best.pt")

if __name__ == "__main__":
    train_classification_model()