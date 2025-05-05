import fs from 'node:fs';
import readline from "node:readline";

const scvRegex = /(".*?"|[^",\s]*)(?=\s*,|\s*$)/g;
const stringTypedFields = ['Name', 'Sex', 'Cabin', 'Embarked', 'Ticket']

const getPassengerFieldNames = (line, columnIndexedNames) => {
  line
    .split(scvRegex)
    .map((fieldName, index) => {
      if (fieldName.length > 1) {
        columnIndexedNames.set(index, fieldName);
      }
    })
}

const getPassengerInfo = (line, columnIndexedNames) => {
  const passenger = {}
  line.split(scvRegex)
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
  return passenger;
}

async function getPassengersList() {
  const reader = readline.createInterface({
      input: fs.createReadStream('../stats_titanic.csv', {encoding: 'utf8'}),
      crlfDelay: Infinity
    }
  )
  const columnIndexedNames = new Map() // map of field name and corresponding index of the column in the file as key
  const passengersInfo = [] // array that contains all passengers info

  return new Promise((resolve, reject) => {

    reader.on('line', (line) => {
      if (line.length < 2) return;
      !columnIndexedNames.size ?
        getPassengerFieldNames(line, columnIndexedNames) // this is the first line, and we get field names from here
        : passengersInfo.push(getPassengerInfo(line, columnIndexedNames)) // line with passenger info
    })

    reader.on('close', () => resolve(passengersInfo))

    reader.on('error', (err) => reject(err))
  })
}

// here must be try-catch block but I don't care so far
const passengers = await getPassengersList()

const calculateTotalFares = (passengersInfo) => {
  return passengersInfo.reduce((acc, current) => acc += current['Fare'], 0).toFixed(2)
}

const calculateAverageFareByClass = (pClass, passengersInfo) => {
  const filteredPassengers = passengersInfo.filter(passenger => passenger['Pclass'] === pClass)
  return (calculateTotalFares(filteredPassengers) / filteredPassengers.length).toFixed(2)
}

const calculateBySurvival = (gotSurvived, passengersInfo) => {
  const filteredPassengers = passengersInfo.filter(passenger => passenger['Survived'] === gotSurvived)
  return filteredPassengers.length
}

const calculateMenBySurvival = (gotSurvived, passengersInfo) => {
  const men = passengersInfo
    .filter(passenger => passenger['Sex'] === 'male' && (passenger['Age'] >= 18 || passenger['Age'] === 0))
  return calculateBySurvival(gotSurvived, men)
}

const calculateWomenBySurvival = (gotSurvived, passengersInfo) => {
  const women = passengersInfo
    .filter(passenger => passenger['Sex'] === 'female' && (passenger['Age'] >= 18 || passenger['Age'] === 0))
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