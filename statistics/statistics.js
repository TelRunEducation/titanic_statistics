import fs from 'node:fs/promises';

async function getPassengersList() {
  const passengersInfo = []
  try {
    const data = await fs.readFile('../stats_titanic.csv', 'utf8');
    const stringTypedFields = ['Name', 'Sex', 'Cabin', 'Embarked', 'Ticket']
    const scvRegex = /(".*?"|[^",\s]*)(?=\s*,|\s*$)/g;

    const dataRows = data.split('\n');
    const columnIndexedNames = new Map() // map that contains column index as a key and column name as value
    dataRows
      .shift()
      .replace('\n', '')
      .replace('\r', '')
      .trim()
      .split(scvRegex).map((fieldName, index) => {
      if (fieldName.length > 1) {
        columnIndexedNames.set(index, fieldName);
      }
    })

    dataRows.pop() // last row is not valid

    dataRows.forEach((row) => {
      const passenger = {}
      row.split(scvRegex)
        .forEach((data, index) => {
          if (columnIndexedNames.has(index)) {
            const fieldName = columnIndexedNames.get(index);
            if (stringTypedFields.includes(fieldName)) {
              passenger[fieldName] = data.replaceAll('"', '');
            } else {
              passenger[fieldName] = isNaN(+data) ? 0 : +data;
            }
          }
        })
      passengersInfo.push(passenger);
    })

  } catch (err) {
    console.error(err);
  }
  return passengersInfo;
}

const passengers = await getPassengersList()

const calculateTotalFares = (passengersInfo) => {
  return passengersInfo.reduce((acc, current) => acc += current['Fare'], 0).toFixed(2)
}

const calculateAverageFareByClass = (pClass, passengersInfo) => {
  const filteredPassengers = passengersInfo.filter(passenger => passenger['Pclass'] === pClass)
  return (calculateTotalFares(filteredPassengers)/filteredPassengers.length).toFixed(2)
}

const calculateBySurvival = (gotSurvived, passengersInfo) => {
  const filteredPassengers = passengersInfo.filter(passenger => passenger['Survived'] === gotSurvived)
  return filteredPassengers.length
}

const calculateMenBySurvival = (gotSurvived, passengersInfo) => {
  const men = passengersInfo.filter(passenger => passenger['Sex'] === 'male' && passenger['Age'] >=18)
  return calculateBySurvival(gotSurvived, men)
}

const calculateWomenBySurvival = (gotSurvived, passengersInfo) => {
  const women = passengersInfo
    .filter(passenger => passenger['Sex'] === 'female' && (passenger['Age'] >=18 || passenger['Age'] === 0))
  return calculateBySurvival(gotSurvived, women)
}

const calculateChildrenBySurvival = (gotSurvived, passengersInfo) => {
  const children = passengersInfo.filter(passenger => passenger['Age'] < 18 && passenger['Age'] !== 0)
  return calculateBySurvival(gotSurvived, children)
}

console.log('Total Fare:', calculateTotalFares(passengers));
console.log('------------------------------------------------------')
console.log('Average Fare, class 1:', calculateAverageFareByClass(1, passengers));
console.log('Average Fare, class 2:', calculateAverageFareByClass(2, passengers))
console.log('Average Fare, class 3:', calculateAverageFareByClass(3, passengers))
console.log('------------------------------------------------------')
console.log('Non-survived passengers:', calculateBySurvival(0, passengers));
console.log('Survived passengers:', calculateBySurvival(1, passengers));
console.log('------------------------------------------------------')
console.log('Survived men:', calculateMenBySurvival(1, passengers));
console.log('Non-survived men:', calculateMenBySurvival(0, passengers));
console.log('------------------------------------------------------')
console.log('Survived women:', calculateWomenBySurvival(1, passengers));
console.log('Non-survived women:', calculateWomenBySurvival(0, passengers));
console.log('------------------------------------------------------')
console.log('Survived children:', calculateChildrenBySurvival(1, passengers));
console.log('Non-survived children:', calculateChildrenBySurvival(0, passengers));