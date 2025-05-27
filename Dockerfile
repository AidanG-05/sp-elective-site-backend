# Use a base image with both Python and Node.js
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    pip3 install --upgrade pip

# Install Python dependencies
COPY app.py requirements.txt ./
RUN pip3 install -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app
COPY . .

# Expose the ports (Node = 5001, Flask = 5002)
EXPOSE 5001 5002

# Start both servers using a process manager
CMD ["sh", "-c", "node server.js"]
