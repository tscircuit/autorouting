from flask import Flask, request, jsonify
from autoroute import autoroute 

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def solve():
    simple_route_json = request.json['simple_route_json']

    solution = autoroute(simple_route_json)

    return jsonify({
        "solution_soup": solution
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1234)