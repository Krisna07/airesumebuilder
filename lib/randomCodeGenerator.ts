export default function RandomCodeGenerator() {
    const min = 1000;
    const max = 9999;
    const code = Math.floor(Math.random() * (max - min)) + min;
    return code;
}