// Question source: https://codereview.stackexchange.com/questions/183204/multi-field-sorting
// Original code author: https://github.com/benaston

const flatten = objectToFlatten => Object
  .values(objectToFlatten)
  .reduce(
    (subResultArray, currentElement) =>
      Array.isArray(currentElement) ?
        [...subResultArray, ...currentElement] :
        typeof currentElement === 'object' ?
          [...subResultArray, ...flatten(currentElement)] :
          [...subResultArray, currentElement],
    []
  );

const compose = (...functionList) =>
  argument =>
    functionList.reduce((previousResult, currentFunction) => currentFunction(previousResult), argument);

const GROUP = Symbol('group');
const asGroup = (result = [] as any[]) => ((result[GROUP] = true), result);
const isGroup = object => object[GROUP];

const groupBy = groupingField =>
  (objectList, key) =>
    objectList.reduce(
      (subresultObject, dataElement) => (
        (key = dataElement[groupingField]),
        (
          subresultObject[key] ?
            (subresultObject[key].push(dataElement), subresultObject) :
            ((subresultObject[key] = asGroup([dataElement])), subresultObject)
        )
      ),
      {}
    );

const transformRecursivelyWithPredicate = predicate =>
  transform =>
    objectToTransform =>
      predicate(objectToTransform)
        ? transform(objectToTransform)
        : Object.entries(objectToTransform)
          .sort(([_, value1], [__, value2]) => value1 - value2)
          .reduce(
            (subresult, [key, value]) => (
              predicate(value) ? 
                ((subresult[key] = transform(value)), subresult) : 
                ((subresult[key] = transformRecursivelyWithPredicate(predicate)(transform)(value)), subresult)
            ),
            {}
          );
                  
const group = (...groupingFields) =>
  compose(...groupingFields.map(compose(groupBy, transformRecursivelyWithPredicate(isGroup))), flatten);

const rows = asGroup([
  {
    id: 0,
    steamid: '2',
    website: 'a'
  }, {
    id: 1,
    steamid: '2',
    website: 'b'
  }, {
    id: 2,
    steamid: '2',
    website: 'a'
  }, {
    id: 3,
    steamid: '1',
    website: 'b'
  }, {
    id: 4,
    steamid: '0',
    website: 'b'
  }, {
    id: 5,
    steamid: '2',
    website: 'b'
  }
]);
console.log(JSON.stringify(group('steamid', 'website', 'id')(rows), null, 2));
