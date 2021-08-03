export declare type Atom = {
    /**
     * Invoke this method to notify mobx that your atom has been used somehow.
     * Returns true if there is currently a reactive context.
     */
    reportObserved(implicitObserver?: any): boolean;
    /**
     * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
     */
    reportChanged(): void;
};
export declare function createAtom(_name: string, _onBecomeObservedHandler?: () => void, _onBecomeUnobservedHandler?: () => void): Atom;
export declare function useMobxBindings(mobx: any): void;
export declare var vueRef: any;
export declare function useVueBindings(vue: any): void;
export declare function useReactiveBindings(reactive: any): void;
