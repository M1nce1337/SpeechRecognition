FROM python:3.14-slim
WORKDIR /src
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

RUN apt-get update && apt-get install -y gcc build-essential \
    && pip install -r requirements.txt \
    && apt-get remove -y gcc build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*
  
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 