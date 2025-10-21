import multiprocessing


# Bind to the port Azure provides (App Setting PORT) or default 8000
bind = f"0.0.0.0:{__import__('os').environ.get('PORT', '8000')}"
workers = max(multiprocessing.cpu_count() // 2, 2)
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
loglevel = "info"
