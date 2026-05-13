graph TD
    User((Web User))
    
    subgraph DockerCompose [Môi trường Docker Compose Local]
        direction TB
        
        Frontend[Frontend Container<br>React/Next.js]
        NodeAPI[Backend API Container<br>Node.js / Express]
        PyWorker[AI Worker Container<br>Python / FastAPI]
        
        Broker[(RabbitMQ Container)]
        DB[(Database Container<br>MongoDB)]
        
        Volume{{Docker Shared Volume<br>/app/uploads}}
    end

    User -- 1. Upload ảnh gốc --> Frontend
    Frontend -- 2. Gửi file và Request --> NodeAPI
    
    NodeAPI -- 3a. Lưu file gốc --> Volume
    NodeAPI -- 3b. Lưu trạng thái --> DB
    NodeAPI -- 4. Đẩy Task vào Hàng đợi --> Broker
    
    Broker -- 5. Nhận Task --> PyWorker
    PyWorker -- 6. Đọc file gốc --> Volume
    
    subgraph AIPipeline [AI Pipeline]
        Model[In-Image Translation<br>DebackX Model]
    end
    PyWorker -. Xử lý mô hình .-> Model
    
    PyWorker -- 7. Lưu ảnh tiếng Việt --> Volume
    PyWorker -- 8. Báo cáo hoàn thành --> Broker
    Broker -- 9. Nhận tín hiệu --> NodeAPI
    
    NodeAPI -- 10. Cập nhật Database --> DB
    NodeAPI -- 11. Thông báo Socket.io --> Frontend
    Frontend -- Hiển thị kết quả --> User

    classDef container fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
    classDef volume fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef ai fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px;
    
    class Frontend,NodeAPI,PyWorker,Broker,DB container;
    class Volume volume;
    class Model ai;