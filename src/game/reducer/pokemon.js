// Pokemon reducer handlers. The implementation lives in game/reducer/pokemon/:
// management, party-box, evolution, daycare and wonder-trade. Re-exported here
// so game/reducer.js keeps importing the handlers from one place.

export { releaseDuplicates, releaseHatchling, clearHatchResult, setMoves, toggleFavourite, setNickname, catchPokemon, releasePokemon } from './pokemon/management.js'
export { reorderParty, swapParty, partyToBox, boxToParty, swapPartyBox, reorderBox, setBoxSort } from './pokemon/party-box.js'
export { startEvolution, evolutionStep, completeEvolution } from './pokemon/evolution.js'
export { depositDaycare, withdrawDaycare, hatchDaycareEgg } from './pokemon/daycare.js'
export { wonderTrade, completeWonderTrade } from './pokemon/wonder-trade.js'
