const MEMOIZE = '__memoize__';

export default function Memoize(target, name, descriptor) {
   const {value} = descriptor;

   return {
      ...descriptor,
      value(...args){
         const memoizeName = Symbol.for(`${MEMOIZE}${name}|${args.join('|')}`);

         if(!this[memoizeName]){
            this[memoizeName] = value.call(this, ...args);
         }

         return this[memoizeName];
      }
   }
}