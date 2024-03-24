FROM python:3.9-slim AS server

WORKDIR /app

COPY model/server.py /app/
COPY model/requirements.txt /app/

RUN pip install -r requirements.txt
RUN pip install torch torchvision torchaudio -f https://download.pytorch.org/whl/cpu/torch_stable.html
EXPOSE 5000

CMD ["python", "server.py"]