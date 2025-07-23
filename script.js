document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("validate").addEventListener("click", validateGuess);

let mots = [];
let lettresDesMots = [];
let motActuel = [];
let alphabet = {};
let suggestedLetter = "";
let lettresUtilisees = new Set();
let erreurs = 0;

const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");

function drawHangman(errors) {
  let centerman = 120;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#480000";

  // Base
  if (errors >= 1) {
    ctx.moveTo(10, 240);
    ctx.lineTo(190, 240);
  }
  // Poteau
  if (errors >= 2) {
    ctx.moveTo(50, 240);
    ctx.lineTo(50, 20);
  }
  // Barre horizontale
  if (errors >= 3) {
    ctx.moveTo(50, 20);
    ctx.lineTo(centerman, 20);
  }
  // Corde
  if (errors >= 4) {
    ctx.moveTo(centerman, 20);
    ctx.lineTo(centerman, 50);
  }
  // Tête
  if (errors >= 5) {
    ctx.arc(centerman, 70, 20, -Math.PI / 2, 2 * Math.PI);
    ctx.stroke();
  }
  // Corps
  if (errors >= 6) {
    ctx.moveTo(centerman, 90);
    ctx.lineTo(centerman, 150);
  }
  // Bras gauche
  if (errors >= 7) {
    ctx.moveTo(centerman, 100);
    ctx.lineTo(centerman - 30, 130);
  }
  // Bras droit
  if (errors >= 8) {
    ctx.moveTo(centerman, 100);
    ctx.lineTo(centerman + 30, 130);
  }
  // Jambe gauche
  if (errors >= 9) {
    ctx.moveTo(centerman, 150);
    ctx.lineTo(centerman - 20, 190);
  }
  // Jambe droite
  if (errors >= 10) {
    ctx.moveTo(centerman, 150);
    ctx.lineTo(centerman + 20, 190);
  }

  if (errors >= 11) {
    ctx.strokeStyle = "#d80000";
    let ecart = 11;
    let posy = 60;
    let taille = 8;
    let ecarty = 14;
    ctx.moveTo(centerman - ecart, posy);
    ctx.lineTo(centerman - ecart + taille, posy + taille);
    ctx.moveTo(centerman - ecart + taille, posy);
    ctx.lineTo(centerman - ecart, posy + taille);

    ctx.moveTo(centerman + ecart, posy);
    ctx.lineTo(centerman + ecart - taille, posy + taille);
    ctx.moveTo(centerman + ecart - taille, posy);
    ctx.lineTo(centerman + ecart, posy + taille);

    ctx.moveTo(centerman + ecart, posy + ecarty + taille);
    ctx.lineTo(centerman - ecart, posy + ecarty);
    ctx.moveTo(centerman + ecart, posy + ecarty);
    ctx.lineTo(centerman - ecart, posy + ecarty + taille);
  }
  ctx.stroke();
}

async function startGame() {
  let langue = document.getElementById("language").value;
  let longueur = parseInt(document.getElementById("wordLength").value);

  if (!longueur) return alert("Veuillez entrer une longueur valide !");
  let url = `https://cdn.glitch.global/85a4a1cd-5d48-419f-abd1-0cb75d9f745e/${langue}`;
  let response = await fetch(url);
  let texte = await response.text();
  let listeMots = texte.split("\n").map((m) => m.trim().toLowerCase());

  mots = listeMots.filter((mot) => mot.length === longueur);
  lettresDesMots = mots.map((mot) => mot.split(""));
  motActuel = Array(longueur).fill("_");
   lettresUtilisees.clear();
  erreurs = 0;

  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";

  drawHangman(erreurs);
  updateUI();
}

function getMostFrequentLetter() {
  alphabet = {};

  mots.forEach((mot) => {
    new Set(mot).forEach((l) => {
      if (!lettresUtilisees.has(l)) {
        alphabet[l] = (alphabet[l] || 0) + 1;
      }
    });
  });

  let sortedLetters = Object.entries(alphabet).sort((a, b) => b[1] - a[1]);
  return sortedLetters.length > 0 ? sortedLetters[0][0] : "";
}

function updateUI() {
  document.getElementById("wordDisplay").innerHTML = motActuel
    .map((char, i) => `<div class="letter-box" data-index="${i}">${char}</div>`)
    .join("");

  document.getElementById("wordsLeft").textContent = mots.length;

  suggestedLetter = getMostFrequentLetter();
  document.getElementById("suggestedLetter").textContent =
    suggestedLetter || "Aucune";

  let boxes = document.querySelectorAll(".letter-box");
  boxes.forEach((box) => box.addEventListener("click", togglePosition));
}

function togglePosition(event) {
  let box = event.target;
  box.classList.toggle("selected");
}

function validateGuess() {
  let selectedPositions = [
    ...document.querySelectorAll(".letter-box.selected"),
  ].map((box) => parseInt(box.dataset.index));

  let newMots = [];
  let newLettresDesMots = [];

  if (selectedPositions.length === 0) {
    // Si la lettre suggérée n'est pas dans le mot, on l'exclut des mots restants
    erreurs++;
    drawHangman(erreurs);

    mots.forEach((mot, i) => {
      if (!mot.includes(suggestedLetter)) {
        newMots.push(mot);
        newLettresDesMots.push(lettresDesMots[i]);
      }
    });
  } else {
    // Si la lettre est présente, on garde uniquement les mots avec la lettre aux positions indiquées
    mots.forEach((mot, i) => {
      let valid = selectedPositions.every(
        (pos) => lettresDesMots[i][pos] === suggestedLetter
      );
      if (valid) {
        newMots.push(mot);
        newLettresDesMots.push(lettresDesMots[i]);
      }
    });

    selectedPositions.forEach((pos) => (motActuel[pos] = suggestedLetter));
  }

  mots = newMots;
  lettresDesMots = newLettresDesMots;

  // Ajouter la lettre validée aux lettres utilisées
  lettresUtilisees.add(suggestedLetter);

  if (mots.length === 1) {
    alert(`Mot trouvé : ${mots[0]}`);
    document.getElementById("wordDisplay").innerHTML = mots[0]
      .split("")
      .map((l) => `<div class="letter-box">${l}</div>`)
      .join("");
    return;
  } else if (mots.length === 0) {
    alert("Aucun mot trouvé !");
    return;
  }

  updateUI();
}
