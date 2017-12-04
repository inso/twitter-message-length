# Twitter Message Length
Microservice used for text length calculation based on Twitter message rules.

## Endpoints
    GET /symbols-left?message=%MESSAGE TEXT%
    POST /symbols-left # message provided using request body
Returns number of characters left based on Twitter message limit.

    POST /message-length # message provided using request body
Returns message length.

## Installation
    git clone https://github.com/inso/twitter-message-length.git
    cd twitter-message-length
    npm install
    node index.js
