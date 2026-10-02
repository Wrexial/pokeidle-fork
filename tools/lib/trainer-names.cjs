// Route-trainer classes, labels and name pools, shared by
// `generate-regions.cjs` and `apply-trainer-variety.cjs` so both can add
// trainers (and reuse classes across a town for variety).

const TRAINER_CLASSES = [
  'youngster', 'lass', 'bugCatcher', 'hiker', 'camper', 'beauty',
  'coolTrainer', 'psychic', 'scientist', 'ace', 'blackbelt', 'swimmer',
  'sailor', 'gentleman', 'channeler', 'tamer', 'juggler', 'superNerd',
  'fisherman', 'picnicker', 'birdKeeper', 'burglar', 'guitarist', 'cowgirl',
  'cyclist', 'lady', 'pilot', 'skier', 'waiter', 'richBoy',
  'worker', 'idol', 'policeman', 'aromaLady', 'chef', 'dancer',
  'gambler', 'nurse', 'biker', 'schoolkid', 'roughneck', 'parasolLady',
  'musician', 'preschooler', 'artist', 'backpacker', 'pokemonRanger', 'doctor',
  'veteran', 'medium',
]

// Display names for the generated route trainers, so battles read
// "Youngster Joey" instead of "Route 2 Trainer 1".
const TRAINER_CLASS_LABELS = {
  youngster: 'Youngster',
  lass: 'Lass',
  bugCatcher: 'Bug Catcher',
  hiker: 'Hiker',
  camper: 'Camper',
  beauty: 'Beauty',
  coolTrainer: 'Cooltrainer',
  psychic: 'Psychic',
  scientist: 'Scientist',
  ace: 'Ace Trainer',
  blackbelt: 'Blackbelt',
  swimmer: 'Swimmer',
  sailor: 'Sailor',
  gentleman: 'Gentleman',
  channeler: 'Channeler',
  tamer: 'Tamer',
  juggler: 'Juggler',
  superNerd: 'Super Nerd',
  fisherman: 'Fisherman',
  picnicker: 'Picnicker',
  birdKeeper: 'Bird Keeper',
  burglar: 'Burglar',
  guitarist: 'Guitarist',
  cowgirl: 'Cowgirl',
  cyclist: 'Cyclist',
  lady: 'Lady',
  pilot: 'Pilot',
  skier: 'Skier',
  waiter: 'Waiter',
  richBoy: 'Rich Boy',
  worker: 'Worker',
  idol: 'Idol',
  policeman: 'Policeman',
  aromaLady: 'Aroma Lady',
  chef: 'Chef',
  dancer: 'Dancer',
  gambler: 'Gambler',
  nurse: 'Nurse',
  biker: 'Biker',
  schoolkid: 'Schoolkid',
  roughneck: 'Roughneck',
  parasolLady: 'Parasol Lady',
  musician: 'Musician',
  preschooler: 'Preschooler',
  artist: 'Artist',
  backpacker: 'Backpacker',
  pokemonRanger: 'Pokemon Ranger',
  doctor: 'Doctor',
  veteran: 'Veteran',
  medium: 'Medium',
}

// First names for the generated trainers, split by the gender each class is
// drawn as so a trainer reads naturally ("Beauty Rosa", "Hiker Bruno") instead
// of pairing any name with any class. Mixed classes draw from both lists.
const TRAINER_NAMES_MALE = [
  'Aaron', 'Alex', 'Andre', 'Ben', 'Blake', 'Bruno', 'Caleb', 'Carlos', 'Cody', 'Cole',
  'Dante', 'Dev', 'Eli', 'Elliot', 'Felix', 'Finn', 'Gavin', 'Hiro', 'Hugo', 'Ivan',
  'Jack', 'Jasper', 'Joel', 'Kai', 'Kenji', 'Leo', 'Liam', 'Luca', 'Marco', 'Mason',
  'Miles', 'Nate', 'Neil', 'Noah', 'Oscar', 'Owen', 'Paul', 'Quinn', 'Rex', 'Riley',
  'Ryan', 'Sam', 'Seth', 'Silas', 'Theo', 'Toby', 'Victor', 'Wade', 'Wesley', 'Xander',
  'Zane', 'Zeke',
]
const TRAINER_NAMES_FEMALE = [
  'Alice', 'Amber', 'Aria', 'Ava', 'Bella', 'Bianca', 'Cara', 'Chloe', 'Claire', 'Cleo',
  'Daisy', 'Dana', 'Elena', 'Ella', 'Emma', 'Fiona', 'Freya', 'Grace', 'Hana', 'Hazel',
  'Iris', 'Isla', 'Jade', 'Julia', 'Kira', 'Lara', 'Lena', 'Lily', 'Luna', 'Maya',
  'Mia', 'Nina', 'Nora', 'Olivia', 'Paige', 'Pia', 'Rosa', 'Ruby', 'Sana', 'Sarah',
  'Sofia', 'Tara', 'Tessa', 'Uma', 'Vera', 'Wendy', 'Yara', 'Yuki', 'Zoe', 'Zelda',
]
const TRAINER_NAMES_ANY = [...new Set([...TRAINER_NAMES_MALE, ...TRAINER_NAMES_FEMALE])]

// Classes that field a specific gender; anything else can be either.
const FEMALE_TRAINER_CLASSES = new Set([
  'lass', 'beauty', 'channeler', 'picnicker', 'cowgirl', 'lady', 'idol', 'aromaLady',
  'parasolLady', 'nurse',
])
const MALE_TRAINER_CLASSES = new Set([
  'youngster', 'hiker', 'bugCatcher', 'camper', 'blackbelt', 'sailor', 'gentleman',
  'tamer', 'juggler', 'superNerd', 'fisherman', 'birdKeeper', 'burglar', 'cyclist',
  'pilot', 'waiter', 'worker', 'richBoy', 'policeman', 'chef', 'biker', 'roughneck',
])

/** @param {string} trainerClass */
const trainerNamesForClass = (trainerClass) =>
  FEMALE_TRAINER_CLASSES.has(trainerClass)
    ? TRAINER_NAMES_FEMALE
    : MALE_TRAINER_CLASSES.has(trainerClass)
      ? TRAINER_NAMES_MALE
      : TRAINER_NAMES_ANY

/**
 * Pick a name no other trainer of the same class in this region already has.
 * @param {string} trainerClass
 * @param {Set<string>} usedNames
 * @param {number} seed
 * @param {number} index
 */
const pickTrainerName = (trainerClass, usedNames, seed, index) => {
  const pool = trainerNamesForClass(trainerClass)
  let nameIndex = (seed + index * 31) % pool.length,
    attempts = 0
  while (usedNames.has(`${trainerClass}:${pool[nameIndex]}`) && attempts < pool.length) {
    nameIndex = (nameIndex + 1) % pool.length
    attempts++
  }
  usedNames.add(`${trainerClass}:${pool[nameIndex]}`)
  return pool[nameIndex]
}

module.exports = {
  TRAINER_CLASSES,
  TRAINER_CLASS_LABELS,
  TRAINER_NAMES_MALE,
  TRAINER_NAMES_FEMALE,
  TRAINER_NAMES_ANY,
  FEMALE_TRAINER_CLASSES,
  MALE_TRAINER_CLASSES,
  trainerNamesForClass,
  pickTrainerName,
}
