// Pokemon reducer handlers. The implementation lives in game/reducer/pokemon/:
// management, party-box, evolution, daycare and wonder-trade. Re-exported here
// so game/reducer.js keeps importing the handlers from one place.

export { releaseDuplicates, releaseFiltered, releaseFainted, releaseHatchling, clearHatchResult, setMoves, toggleFavourite, setNickname, catchPokemon, releasePokemon } from './pokemon/management.js'
export { reorderParty, partyToBox, boxToParty, swapPartyBox, reorderBox, setBoxSort, bankDeposit, bankWithdraw } from './pokemon/party-box.js'
export { saveTeamPreset, deleteTeamPreset, applyTeamPreset } from './pokemon/team-presets.js'
export { startEvolution, evolutionStep, completeEvolution } from './pokemon/evolution.js'
export { depositDaycare, withdrawDaycare, hatchDaycareEgg } from './pokemon/daycare.js'
export { wonderTrade, completeWonderTrade } from './pokemon/wonder-trade.js'
