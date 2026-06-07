import random

difficultyRates = {'easy': 0.05, 'normal': 0.10, 'hard': 0.15}

def simulate_game(difficulty='normal'):
    game = {
        'currentTurn': 1,
        'maxTurns': 24,
        'gold': 90,
        'trust': 50,
        'complaint': 25,
        'military': 20,
        'towerHp': 75,
        'selectedPolicy': 'repair',
        'taxConsumption': 10,
        'taxIncome': 25,
        'taxResident': 10,
        'difficulty': difficulty,
    }
    while True:
        if game['towerHp'] < 60 and game['gold'] >= 15:
            game['selectedPolicy'] = 'repair'
        elif game['complaint'] > 45 and game['gold'] >= 12:
            game['selectedPolicy'] = 'education'
        elif game['complaint'] > 35 and game['gold'] >= 10:
            game['selectedPolicy'] = 'defense'
        elif game['military'] < 30 and game['gold'] >= 15:
            game['selectedPolicy'] = 'train'
        elif game['gold'] < 40 and game['gold'] >= 10:
            game['selectedPolicy'] = 'defense'
        else:
            if game['towerHp'] < 80 and game['gold'] >= 15:
                game['selectedPolicy'] = 'repair'
            else:
                game['selectedPolicy'] = 'defense'

        if game['taxIncome'] > 35:
            game['trust'] -= 4
        elif game['taxIncome'] < 15:
            game['trust'] += 3

        if game['selectedPolicy'] == 'repair':
            game['gold'] -= 15
            game['towerHp'] = min(100, game['towerHp'] + 20)
        elif game['selectedPolicy'] == 'defense':
            game['gold'] -= 10
            game['complaint'] = max(0, game['complaint'] - 5)
        elif game['selectedPolicy'] == 'education':
            game['gold'] -= 12
            game['trust'] += 10
            game['complaint'] = max(0, game['complaint'] - 10)
        elif game['selectedPolicy'] == 'train':
            game['gold'] -= 15
            game['military'] += 10

        if game['towerHp'] < 50:
            game['trust'] -= 5

        game['complaint'] = max(0, min(100, game['complaint']))
        game['trust'] = max(0, min(100, game['trust']))

        isDefenseActive = game['selectedPolicy'] == 'defense'
        cataclysmChance = (game['taxConsumption'] / 100) * (game['taxIncome'] / 100) * (game['taxResident'] / 100)
        if random.random() < cataclysmChance:
            if not isDefenseActive:
                return False
        else:
            disasterChance = difficultyRates[game['difficulty']]
            if isDefenseActive:
                disasterChance = 0.0
            if random.random() < disasterChance:
                season = ['春', '夏', '秋', '冬'][(game['currentTurn'] - 1) % 4]
                avail = [('台風', 30), ('大火', 30), ('洪水', 15), ('地震', 20), ('落雷', 15)]
                if season == '冬':
                    avail.extend([('冷害', 20), ('雪崩', 25)])
                if game['gold'] < 60:
                    avail.append(('飢饉', 15))
                game['towerHp'] -= random.choice(avail)[1]

        while game['gold'] > 0:
            attackChance = 0.0
            if game['trust'] <= 0:
                attackChance = 1.0
            elif game['gold'] < 75 and game['complaint'] > 20:
                attackChance = 2 / game['gold']
            else:
                break
            if random.random() < attackChance:
                attackers = game['complaint']
                enemyPower = (attackers * 2) + 10
                governmentPower = game['military'] + game['trust']
                game['towerHp'] -= 10
                if governmentPower >= enemyPower:
                    militaryLoss = min(game['military'], attackers // 2)
                    game['military'] = max(0, game['military'] - militaryLoss)
                else:
                    return False
                if game['trust'] <= 0:
                    break
            else:
                break

        if game['complaint'] >= 100:
            return False
        elif game['complaint'] > 50:
            if random.random() < (game['complaint'] - 50) / 50:
                rebelPower = game['complaint'] * 2
                governmentPower = game['military'] + game['trust']
                game['towerHp'] -= 10
                if governmentPower < rebelPower:
                    return False
                game['military'] = max(0, game['military'] - min(game['military'], rebelPower // 2))
                game['complaint'] = 20
                game['trust'] = max(0, game['trust'] - 15)

        if game['gold'] <= 0 or game['towerHp'] <= 0:
            return False
        game['currentTurn'] += 1
        if game['currentTurn'] > game['maxTurns']:
            return True

for diff in ['easy', 'normal', 'hard']:
    wins = 0
    N = 2000
    for i in range(N):
        if simulate_game(diff):
            wins += 1
    print(diff, wins, N, wins / N)
