import * as React from 'react';
declare type ReactElement = React.ReactElement<any>;
declare type ReactNode = React.ReactNode;
interface IDecorateOptions {
    words: string[];
}
export interface IDecorateHtmlOptions extends IDecorateOptions {
    replace: string;
}
export interface IDecorateReactOptions extends IDecorateOptions {
    replace: string | ReactElement;
}
export declare function decorateDOMClasses(textClasses: string | string[], options: IDecorateHtmlOptions, wordClass?: string, listeners?: IEventListeners, container?: Element | Document): void;
export declare function decorateHtml(input: string, options: IDecorateHtmlOptions): string;
interface IEventListener {
    type: string;
    listener: (evt: Event) => void;
}
declare type IEventListeners = IEventListener | IEventListener[];
export declare function addEventListeners(className: string, listeners: IEventListeners, container?: Element | Document): void;
export declare function removeEventListeners(className: string, listeners: IEventListeners, container?: Element | Document): void;
export declare function decorateReact(input: ReactNode, options: IDecorateReactOptions): ReactNode;
export declare function decorateReactHOC(options: IDecorateReactOptions): <P extends object>(WrappedComponent: React.ComponentClass<P>) => {
    new (props: P, context?: any): {
        render(): React.ReactNode;
        setState<K extends never>(state: React.ComponentState | ((prevState: Readonly<React.ComponentState>, props: P) => React.ComponentState | Pick<React.ComponentState, K> | null) | Pick<React.ComponentState, K> | null, callback?: (() => void) | undefined): void;
        forceUpdate(callBack?: (() => void) | undefined): void;
        props: Readonly<{
            children?: React.ReactNode;
        }> & Readonly<P>;
        state: Readonly<React.ComponentState>;
        context: any;
        refs: {
            [key: string]: React.ReactInstance;
        };
    };
    propTypes?: React.ValidationMap<P> | undefined;
    contextTypes?: React.ValidationMap<any> | undefined;
    childContextTypes?: React.ValidationMap<any> | undefined;
    defaultProps?: Partial<P> | undefined;
    displayName?: string | undefined;
    getDerivedStateFromProps?: React.GetDerivedStateFromProps<P, any> | undefined;
};
interface IProps {
    decorateOptions: IDecorateReactOptions;
}
export declare const DecorateChildren: React.SFC<IProps>;
export {};
