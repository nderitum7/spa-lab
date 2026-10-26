
const form = document.getElementById("searchForm");
const wordInput = document.getElementById("wordInput");
const results = document.getElementById("results");
const status = document.getElementById("status");
const favoritesList = document.getElementById("favoritesList");
const themeButton = document.getElementById("themeButton");

let favorites = JSON.parse(localStorage.getItem("wordlyFavorites")) || [];

function saveFavorites() {
    localStorage.setItem("wordlyFavorites", JSON.stringify(favorites));
    displayFavorites();
}

function displayFavorites() {
    favoritesList.replaceChildren();

    if (favorites.length === 0) {
        const message = document.createElement("li");
        message.textContent = "No favorite words saved yet.";
        favoritesList.appendChild(message);
        return;
    }

    favorites.forEach(function (word) {
        const item = document.createElement("li");
        item.className = "favorite-item";

        const searchButton = document.createElement("button");
        searchButton.className = "favorite-word";
        searchButton.textContent = word;
        searchButton.setAttribute("aria-label", "Search for " + word);
        searchButton.addEventListener("click", function () {
            wordInput.value = word;
            searchWord(word);
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", "Remove " + word + " from favorites");
        removeButton.addEventListener("click", function () {
            favorites = favorites.filter(function (favorite) {
                return favorite !== word;
            });
            saveFavorites();
        });

        item.append(searchButton, removeButton);
        favoritesList.appendChild(item);
    });
}

async function searchWord(word) {
    results.replaceChildren();
    status.textContent = "Searching...";

    try {
        const response = await fetch(
            "https://api.dictionaryapi.dev/api/v2/entries/en/" +
            encodeURIComponent(word)
        );

        if (!response.ok) {
            throw new Error("Word not found.");
        }

        const data = await response.json();
        const entry = data[0];

        status.textContent = "";

        const heading = document.createElement("h2");
        heading.textContent = entry.word;
        results.appendChild(heading);

        const actions = document.createElement("div");
        actions.className = "word-actions";

        const favoriteButton = document.createElement("button");
        const isFavorite = favorites.includes(entry.word);
        favoriteButton.textContent = isFavorite
            ? "Remove from Favorites"
            : "Save to Favorites";

        favoriteButton.addEventListener("click", function () {
            if (favorites.includes(entry.word)) {
                favorites = favorites.filter(function (word) {
                    return word !== entry.word;
                });
            } else {
                favorites.push(entry.word);
            }

            saveFavorites();
            favoriteButton.textContent = favorites.includes(entry.word)
                ? "Remove from Favorites"
                : "Save to Favorites";
        });

        actions.appendChild(favoriteButton);

        const phonetic = entry.phonetics.find(function (item) {
            return item.text;
        });

        const audio = entry.phonetics.find(function (item) {
            return item.audio;
        });

        const pronunciation = document.createElement("p");
        pronunciation.textContent = "Pronunciation: " +
            (phonetic ? phonetic.text : "Not available");
        results.appendChild(pronunciation);

        if (audio) {
            const audioButton = document.createElement("button");
            audioButton.textContent = "Play Pronunciation";
            audioButton.addEventListener("click", function () {
                const player = new Audio(audio.audio);
                player.play().catch(function () {
                    status.textContent = "Unable to play pronunciation audio.";
                });
            });
            actions.appendChild(audioButton);
        }

        results.appendChild(actions);

        entry.meanings.forEach(function (meaning) {
            const section = document.createElement("section");
            section.className = "definition";

            const partOfSpeech = document.createElement("h3");
            partOfSpeech.textContent = meaning.partOfSpeech;
            section.appendChild(partOfSpeech);

            meaning.definitions.forEach(function (definition, index) {
                const description = document.createElement("p");
                description.textContent = (index + 1) + ". " +
                    definition.definition;
                section.appendChild(description);

                if (definition.example) {
                    const example = document.createElement("p");
                    example.textContent = "Example: " + definition.example;
                    section.appendChild(example);
                }
            });

            const synonyms = meaning.synonyms || [];

            const synonymText = document.createElement("p");
            synonymText.textContent = "Synonyms: " +
                (synonyms.length ? synonyms.join(", ") : "Not available");
            section.appendChild(synonymText);

            results.appendChild(section);
        });

        const source = document.createElement("p");
        const sourceLink = document.createElement("a");
        sourceLink.href = entry.sourceUrls && entry.sourceUrls[0]
            ? entry.sourceUrls[0]
            : "https://dictionaryapi.dev/";
        sourceLink.textContent = "View Source";
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        source.appendChild(sourceLink);
        results.appendChild(source);

    } catch (error) {
        status.textContent =
            "Word not found or unable to connect. Please try again.";
    }
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const word = wordInput.value.trim();

    if (!word) {
        status.textContent = "Please enter a word.";
        return;
    }

    searchWord(word);
});

themeButton.addEventListener("click", function () {
    document.body.classList.toggle("dark");
});

displayFavorites();
