from flask import Flask

app = Flask(__name__)

import random

adjectives = [
    "adorable", "bashful", "clever", "determined", "eager",
    "fierce", "grumpy", "happy", "inquisitive", "jolly",
    "kind", "loving", "mysterious", "naughty", "optimistic",
    "playful", "quiet", "rowdy", "silly", "timid"
]

animals = [
    "aardvark", "bear", "cat", "dog", "elephant",
    "fox", "giraffe", "hippo", "iguana", "jaguar",
    "koala", "lemur", "monkey", "newt", "otter",
    "penguin", "quokka", "raccoon", "sloth", "tiger",
    "uakari", "vulture", "walrus", "xerus", "yak", "zebra"
]

def generate_docker_name():
    adjective = random.choice(adjectives)
    animal = random.choice(animals)
    return f"{adjective}_{animal}"

@app.route('/name')
def get_docker_name():
    name = generate_docker_name()
    return name

if __name__ == '__main__':
    app.run(debug=True)
