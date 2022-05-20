export interface Program {
    start(): Promise<void>;
    stop(): Promise<void>;
}
