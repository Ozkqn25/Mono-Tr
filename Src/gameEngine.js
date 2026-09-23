const { SQUARES, COLOR_GROUPS, CHANCE_CARDS, CHEST_CARDS, TOKENS, STARTING_MONEY } = require('./gameData');

function createPlayer(id, name, tokenIndex) {
  return {
    id, name,
    token: TOKENS[tokenIndex % TOKENS.length],
    money: STARTING_MONEY,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutJailCards: 0,
    properties: [],
    isActive: true,
    isBankrupt: false,
    doublesCount: 0
  };
}

function createGame(roomId, hostId) {
  return {
    roomId,
    hostId,
    players: [],
    state: 'lobby', // lobby | playing | ended
    currentPlayerIndex: 0,
    diceRoll: null,
    lastAction: null,
    properties: {},
    chanceCards: shuffle([...CHANCE_CARDS]),
    chestCards: shuffle([...CHEST_CARDS]),
    freeParking: 0,
    log: [],
    pendingAction: null, // { type, data } - bekleyen işlem
    turn: 0
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rollDice() {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return { d1, d2, total: d1 + d2, isDouble: d1 === d2 };
}

function addLog(game, msg) {
  game.log.unshift({ msg, time: new Date().toLocaleTimeString('tr-TR') });
  if (game.log.length > 50) game.log.pop();
}

function currentPlayer(game) {
  return game.players[game.currentPlayerIndex];
}

function getPropertyOwner(game, squareId) {
  if (!game.properties[squareId]) return null;
  return game.players.find(p => p.id === game.properties[squareId].ownerId) || null;
}

function getRent(game, square, dice) {
  const prop = game.properties[square.id];
  if (!prop) return 0;

  if (square.type === 'utility') {
    const ownedUtils = SQUARES.filter(s => s.type === 'utility' && game.properties[s.id]?.ownerId === prop.ownerId).length;
    return dice * (ownedUtils === 2 ? 10 : 4) * 100;
  }
  if (square.type === 'station') {
    const ownedStations = SQUARES.filter(s => s.type === 'station' && game.properties[s.id]?.ownerId === prop.ownerId).length;
    return square.rent[ownedStations - 1];
  }

  const group = COLOR_GROUPS[square.color];
  const monopoly = group.squares.every(sid => game.properties[sid]?.ownerId === prop.ownerId);
  const houses = prop.houses || 0;

  if (houses === 0 && monopoly) return square.rent[0] * 2;
  return square.rent[houses] || square.rent[0];
}

function hasMonopoly(game, playerId, color) {
  const group = COLOR_GROUPS[color];
  if (!group) return false;
  return group.squares.every(sid => game.properties[sid]?.ownerId === playerId);
}

function transferMoney(game, fromId, toId, amount) {
  const from = game.players.find(p => p.id === fromId);
  const to = game.players.find(p => p.id === toId);
  if (from) from.money -= amount;
  if (to) to.money += amount;

  // Borçlu iflasını kontrol et
  if (from && from.money < 0) {
    return checkBankruptcy(game, from, toId, amount);
  }
  return null;
}

function checkBankruptcy(game, player, creditorId, amount) {
  // Aktif mülklerini topla
  const netWorth = player.money + player.properties.reduce((sum, sid) => {
    const sq = SQUARES.find(s => s.id === sid);
    return sum + (sq?.mortgage || 0);
  }, 0);

  if (netWorth < 0) {
    player.isBankrupt = true;
    player.isActive = false;
    addLog(game, `💀 ${player.name} iflas etti!`);

    // Mülklerini bankaya/alacaklıya aktar
    player.properties.forEach(sid => {
      if (creditorId === 'bank') {
        delete game.properties[sid];
      } else {
        if (game.properties[sid]) {
          game.properties[sid].ownerId = creditorId;
          game.properties[sid].houses = 0;
          game.properties[sid].hotel = false;
          const creditor = game.players.find(p => p.id === creditorId);
          if (creditor) creditor.properties.push(sid);
        }
      }
    });
    player.properties = [];
    return 'bankrupt';
  }
  return null;
}

function nextTurn(game) {
  game.pendingAction = null;
  game.diceRoll = null;
  
  const activePlayers = game.players.filter(p => !p.isBankrupt);
  if (activePlayers.length <= 1) {
    game.state = 'ended';
    game.winner = activePlayers[0]?.name || '?';
    return;
  }

  // Sırayı ilerlet
  do {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  } while (game.players[game.currentPlayerIndex].isBankrupt);

  const cp = currentPlayer(game);
  cp.doublesCount = 0;
  game.turn++;
  addLog(game, `🎲 ${cp.name}'in sırası!`);
}

function processLanding(game, player, dice) {
  const sq = SQUARES[player.position];
  
  if (sq.type === 'property' || sq.type === 'station' || sq.type === 'utility') {
    const prop = game.properties[sq.id];
    if (!prop) {
      // Satın alınabilir
      game.pendingAction = { type: 'can_buy', squareId: sq.id, price: sq.price };
      addLog(game, `🏘️ ${player.name} ${sq.name}'a indi — satın alabilir (${sq.price}₺)`);
    } else if (prop.ownerId !== player.id && !prop.mortgaged) {
      const owner = game.players.find(p => p.id === prop.ownerId);
      const rent = getRent(game, sq, dice?.total);
      addLog(game, `💸 ${player.name}, ${owner.name}'a ${rent}₺ kira ödedi! (${sq.name})`);
      transferMoney(game, player.id, owner.id, rent);
      game.pendingAction = { type: 'paid_rent', amount: rent, to: owner.name };
    } else if (prop.ownerId === player.id) {
      addLog(game, `🏠 ${player.name} kendi mülkünde: ${sq.name}`);
      game.pendingAction = { type: 'own_property' };
    }
  } else if (sq.type === 'chance') {
    const card = game.chanceCards.shift();
    game.chanceCards.push(card);
    addLog(game, `🎴 Şans Kartı: ${card.text}`);
    game.pendingAction = { type: 'card', card, cardType: 'chance' };
    applyCard(game, player, card, dice);
  } else if (sq.type === 'chest') {
    const card = game.chestCards.shift();
    game.chestCards.push(card);
    addLog(game, `📦 Toplum Sandığı: ${card.text}`);
    game.pendingAction = { type: 'card', card, cardType: 'chest' };
    applyCard(game, player, card, dice);
  } else if (sq.type === 'tax') {
    addLog(game, `💸 ${player.name} ${sq.name} ödedi: ${sq.amount}₺`);
    player.money -= sq.amount;
    game.freeParking += sq.amount;
    game.pendingAction = { type: 'tax', amount: sq.amount };
  } else if (sq.type === 'corner') {
    if (sq.id === 30) {
      sendToJail(game, player);
    } else if (sq.id === 20) {
      // Bedava park - biriken parayı al
      if (game.freeParking > 0) {
        addLog(game, `🅿️ ${player.name} Bedava Park'ta ${game.freeParking}₺ kazandı!`);
        player.money += game.freeParking;
        game.freeParking = 0;
      } else {
        addLog(game, `🅿️ ${player.name} Bedava Park'ta — hazne boş`);
      }
      game.pendingAction = { type: 'free_parking', amount: game.freeParking };
    } else {
      game.pendingAction = { type: 'nothing' };
    }
  }
}

function applyCard(game, player, card, dice) {
  switch (card.action) {
    case 'collect':
      player.money += card.amount;
      break;
    case 'pay':
      player.money -= card.amount;
      game.freeParking += card.amount;
      break;
    case 'go_to_jail':
      sendToJail(game, player);
      break;
    case 'go_to_start':
      player.position = 0;
      player.money += 1500;
      break;
    case 'move':
      player.position = (player.position + card.amount + 40) % 40;
      processLanding(game, player, dice);
      break;
    case 'birthday':
      game.players.forEach(p => {
        if (p.id !== player.id && !p.isBankrupt) {
          p.money -= card.amount;
          player.money += card.amount;
        }
      });
      break;
    case 'get_out_jail':
      player.getOutJailCards++;
      break;
    case 'repair':
      let cost = 0;
      player.properties.forEach(sid => {
        const prop = game.properties[sid];
        if (!prop) return;
        if (prop.hotel) cost += card.hotel;
        else cost += (prop.houses || 0) * card.house;
      });
      player.money -= cost;
      game.freeParking += cost;
      break;
    case 'go_to':
      player.position = card.square;
      if (card.square < player.position) player.money += 1500; // Başlangıç'ı geç
      processLanding(game, player, dice);
      break;
    case 'nearest_station':
      const stations = [5, 15, 25, 35];
      let nearest = stations.find(s => s > player.position) || stations[0];
      if (nearest <= player.position) player.money += 1500;
      player.position = nearest;
      const stProp = game.properties[nearest];
      if (stProp && stProp.ownerId !== player.id) {
        const stOwner = game.players.find(p => p.id === stProp.ownerId);
        if (stOwner) {
          const rent = getRent(game, SQUARES[nearest], dice?.total) * 2;
          transferMoney(game, player.id, stOwner.id, rent);
          addLog(game, `🚂 ${player.name} ${stOwner.name}'a çift kira ödedi: ${rent}₺`);
        }
      }
      break;
  }
}

function sendToJail(game, player) {
  player.position = 10;
  player.inJail = true;
  player.jailTurns = 0;
  addLog(game, `🚔 ${player.name} hapse gönderildi!`);
  game.pendingAction = { type: 'jail' };
}

// ── Dışa açık aksiyonlar ──────────────────────────────────────────────────

function actionRollDice(game, playerId) {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { error: 'Sıran değil!' };
  if (game.diceRoll && !player.doublesCount) return { error: 'Zaten zar attın!' };
  if (game.pendingAction && game.pendingAction.type !== 'rolled') return { error: 'Önce işlemi tamamla!' };

  const dice = rollDice();
  game.diceRoll = dice;

  if (player.inJail) {
    if (dice.isDouble) {
      player.inJail = false;
      player.jailTurns = 0;
      addLog(game, `🎉 ${player.name} çift attı, hapishaneden çıktı!`);
    } else {
      player.jailTurns++;
      if (player.jailTurns >= 3) {
        player.money -= 500;
        player.inJail = false;
        addLog(game, `💸 ${player.name} 500₺ ödeyerek hapishaneden çıktı.`);
      } else {
        addLog(game, `⛓️ ${player.name} hapishanede: ${dice.d1}+${dice.d2}=${dice.total}`);
        game.pendingAction = { type: 'in_jail' };
        return { ok: true, dice };
      }
    }
  }

  if (dice.isDouble) {
    player.doublesCount++;
    if (player.doublesCount >= 3) {
      addLog(game, `🚔 ${player.name} üç kez çift attı — hapse!`);
      sendToJail(game, player);
      return { ok: true, dice };
    }
  }

  const oldPos = player.position;
  player.position = (player.position + dice.total) % 40;
  if (player.position < oldPos && player.position !== 0) {
    player.money += 1500;
    addLog(game, `🏁 ${player.name} başlangıcı geçti: +1500₺`);
  }

  addLog(game, `🎲 ${player.name}: ${dice.d1}+${dice.d2}=${dice.total} → ${SQUARES[player.position].name}`);
  processLanding(game, player, dice);
  return { ok: true, dice };
}

function actionBuyProperty(game, playerId) {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { error: 'Sıran değil!' };
  if (!game.pendingAction || game.pendingAction.type !== 'can_buy') return { error: 'Satın alınacak mülk yok!' };

  const sq = SQUARES[game.pendingAction.squareId];
  if (player.money < sq.price) return { error: 'Yeterli paran yok!' };

  player.money -= sq.price;
  player.properties.push(sq.id);
  game.properties[sq.id] = { ownerId: playerId, houses: 0, hotel: false, mortgaged: false };
  addLog(game, `🏘️ ${player.name} ${sq.name}'ı satın aldı: ${sq.price}₺`);
  game.pendingAction = { type: 'bought' };
  return { ok: true };
}

function actionDeclineBuy(game, playerId) {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { error: 'Sıran değil!' };
  if (!game.pendingAction || game.pendingAction.type !== 'can_buy') return { error: 'İşlem yok!' };
  addLog(game, `🚫 ${player.name} ${SQUARES[game.pendingAction.squareId].name}'ı satın almadı.`);
  game.pendingAction = { type: 'declined' };
  return { ok: true };
}

function actionEndTurn(game, playerId) {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { error: 'Sıran değil!' };
  if (game.pendingAction?.type === 'can_buy') return { error: 'Önce satın al ya da geç!' };

  if (game.diceRoll?.isDouble && !player.inJail && player.doublesCount < 3) {
    addLog(game, `🎲 ${player.name} çift attı, tekrar zarını atabilir!`);
    game.pendingAction = null;
    game.diceRoll = null;
    return { ok: true, canRollAgain: true };
  }

  nextTurn(game);
  return { ok: true };
}

function actionBuyHouse(game, playerId, squareId) {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return { error: 'Oyuncu bulunamadı!' };
  if (currentPlayer(game).id !== playerId) return { error: 'Sıran değil!' };

  const sq = SQUARES[squareId];
  if (!sq || sq.type !== 'property') return { error: 'Buraya ev yapılamaz!' };
  const prop = game.properties[squareId];
  if (!prop || prop.ownerId !== playerId) return { error: 'Bu mülk sende değil!' };
  if (!hasMonopoly(game, playerId, sq.color)) return { error: 'Tüm grubu satın almadan ev yapamazsın!' };
  if (prop.hotel) return { error: 'Zaten otel var!' };
  if (prop.houses >= 4) {
    // Otel
    if (player.money < sq.houseCost) return { error: 'Para yetmez!' };
    player.money -= sq.houseCost;
    prop.houses = 0;
    prop.hotel = true;
    addLog(game, `🏨 ${player.name} ${sq.name}'a otel dikti!`);
    return { ok: true };
  }
  if (player.money < sq.houseCost) return { error: 'Para yetmez!' };
  player.money -= sq.houseCost;
  prop.houses = (prop.houses || 0) + 1;
  addLog(game, `🏠 ${player.name} ${sq.name}'a ev dikti (toplam: ${prop.houses})`);
  return { ok: true };
}

function actionSellHouse(game, playerId, squareId) {
  const player = game.players.find(p => p.id === playerId);
  const sq = SQUARES[squareId];
  const prop = game.properties[squareId];
  if (!prop || prop.ownerId !== playerId) return { error: 'Bu mülk sende değil!' };

  if (prop.hotel) {
    prop.hotel = false;
    prop.houses = 4;
    player.money += Math.floor(sq.houseCost / 2);
    addLog(game, `🔨 ${player.name} ${sq.name}'daki oteli sattı.`);
    return { ok: true };
  }
  if (!prop.houses) return { error: 'Ev yok!' };
  prop.houses--;
  player.money += Math.floor(sq.houseCost / 2);
  addLog(game, `🔨 ${player.name} ${sq.name}'dan bir ev sattı.`);
  return { ok: true };
}

function actionMortgage(game, playerId, squareId) {
  const player = game.players.find(p => p.id === playerId);
  const sq = SQUARES[squareId];
  const prop = game.properties[squareId];
  if (!prop || prop.ownerId !== playerId) return { error: 'Bu mülk sende değil!' };
  if (prop.mortgaged) return { error: 'Zaten ipotekli!' };
  if (prop.houses || prop.hotel) return { error: 'Önce evleri sat!' };
  prop.mortgaged = true;
  player.money += sq.mortgage;
  addLog(game, `🏦 ${player.name} ${sq.name}'ı ipotek etti: +${sq.mortgage}₺`);
  return { ok: true };
}

function actionUnmortgage(game, playerId, squareId) {
  const player = game.players.find(p => p.id === playerId);
  const sq = SQUARES[squareId];
  const prop = game.properties[squareId];
  if (!prop || prop.ownerId !== playerId) return { error: 'Bu mülk sende değil!' };
  if (!prop.mortgaged) return { error: 'İpotekli değil!' };
  const cost = Math.floor(sq.mortgage * 1.1);
  if (player.money < cost) return { error: 'Para yetmez!' };
  prop.mortgaged = false;
  player.money -= cost;
  addLog(game, `🏦 ${player.name} ${sq.name}'ın ipoteğini kaldırdı: -${cost}₺`);
  return { ok: true };
}

function actionPayJailFine(game, playerId) {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { error: 'Sıran değil!' };
  if (!player.inJail) return { error: 'Hapiste değilsin!' };
  player.money -= 500;
  player.inJail = false;
  player.jailTurns = 0;
  addLog(game, `💸 ${player.name} 500₺ ödeyerek hapishaneden çıktı.`);
  game.pendingAction = null;
  return { ok: true };
}

function actionUseGetOutCard(game, playerId) {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { error: 'Sıran değil!' };
  if (!player.inJail) return { error: 'Hapiste değilsin!' };
  if (!player.getOutJailCards) return { error: 'Kart yok!' };
  player.getOutJailCards--;
  player.inJail = false;
  player.jailTurns = 0;
  addLog(game, `🎴 ${player.name} Hapishaneden Çıkış kartını kullandı!`);
  game.pendingAction = null;
  return { ok: true };
}

module.exports = {
  createPlayer, createGame, rollDice,
  actionRollDice, actionBuyProperty, actionDeclineBuy,
  actionEndTurn, actionBuyHouse, actionSellHouse,
  actionMortgage, actionUnmortgage,
  actionPayJailFine, actionUseGetOutCard,
  SQUARES, COLOR_GROUPS
};
