(async function () {

    class MediaRange {
        constructor() {
            this.type = "";
            this.subtype = "";
            this.weight = {};
            this.parameter = {};
            this['accept-ext'] = {};
        }
    }

    class HTTPParser {
        constructor(options) {

            this.parseMediaRange = this.parseMediaRange.bind(this);
        }

        async parseMediaRange(header) {

            let mediaRange = new MediaRange();
            let part = "";
            let token = "";
            let quoted = false;
            let escaped = false;
            let context = "type";
            let ows = false;

            let index = 0; while (true) {

                let char = header[index];

                if (typeof char == "undefined") {

                    if (context == "parameter" && token && part && !ows) {

                        mediaRange[context][token] = part;
                    }
                    else if (context == "accept-ext" && part && !ows) {
                        if (token) {
                            mediaRange[context][token] = part;
                        }
                        else {
                            mediaRange[context][part] = "";
                        }
                    }
                    else if (context == "subtype" && part && !ows) {

                        mediaRange[context] = part;
                    }
                    else {
                        throw new Error();
                    }

                    return [mediaRange];
                }

                if (char == "," || char == ";") {

                    if (quoted && this.isqdtext(char)) {
                        part = part + char;
                    }
                    else if (context == "subtype" && part) {
                        mediaRange[context] = part;
                        context = "parameter";
                    }
                    else if (context == "parameter" && token && part) {
                        if (token == "q" && !mediaRange.weight.q) {
                            mediaRange["weight"]["q"] = part;
                            context = "accept-ext";
                        }
                        else {
                            mediaRange[context][token] = part;
                        }
                    }
                    else if (context == "accept-ext" && token && part) {
                        mediaRange[context][token] = part;
                    }
                    else if (context == "accept-ext" && !token) {
                        mediaRange[context][part] = "";
                    }
                    else {
                        throw new Error();
                    }

                    if (char == ",") {
                        await new Promise((r, j) => setTimeout(() => r()));

                        return [mediaRange].concat(await this.parseMediaRange(header.slice(++index)));
                    }
                    else {
                        part = "";
                        token = "";
                        ows = false;
                    }
                }
                else if (char == "=") {

                    if (quoted && this.isqdtext(char)) {
                        part = part + char;
                    }
                    else if ((context == "parameter" ||  context == "accept-ext") && part && !ows) {
                        token = part;
                        part = "";
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == "/") {

                    if (quoted && this.isqdtext(char)) {
                        part = part + char;
                    }
                    else if (context == "type" && part && !ows) {
                        mediaRange[context] = part;
                        part = "";
                        context = "subtype";
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == '"') {
                    if (quoted) {

                        if (escaped) {
                            part = part + char;
                            escaped = false;
                        }
                        else if (context == "parameter") {
                            quoted = false;
                        }
                        else if (context == "accept-ext") {
                            quoted = false;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if (token && !part && !ows) {
                        quoted = true;
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == "\\") {
                    if (quoted && escaped) {
                        part = part + char;
                        escaped = false;
                    }
                    else if (quoted && !escaped) {
                        escaped = true;
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (this.isows(char) && !quoted) {
                    ows = true;
                }
                else {
                    if (context == "type") {

                        if (ows && !part && this.istchar(char)) {
                            //  OWS preceeds the start of the token; hence, proceed.
                            part = part + char;
                            ows = false;
                        }
                        else if (!ows && this.istchar(char)) {
                            part = part + char;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if (context == "subtype") {

                        if (!ows && this.istchar(char)) {
                            part = part + char;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if ((context == "parameter" || context == "accept-ext") && !token) {
                        //  We do not have a token; hence, it is a name.
                        if (ows && !part && this.istchar(char)) {
                            //  We are starting a token name with OWS; hence, proceed.
                            part = part + char;
                            ows = false;
                        }
                        else if (!ows && this.istchar(char)) {
                            //  OWS has not happened since starting the token name; hence, proceed.
                            part = part + char;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if ((context == "parameter" || context == "accept-ext") && token) {
                        //  We have a token; hence, it is a value.

                        if (quoted  && this.isqdtext(char)) {
                            part = part + char;
                        }
                        else if (!ows && this.istchar(char)) {
                            part = part + char;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else {
                        throw new Error();
                    }
                }
                index = index + 1;
            }
        }

        istchar(char) {
            for (let delim of '"(),/:;<=>?@[\\]{}') {
                if (char === delim) {
                    return false;
                }
            }
            let codePoint = char.codePointAt(0);
            return codePoint >= 33 && codePoint <= 126
        }

        isqdtext(char) {
            let codePoint = char.codePointAt(0);
            return (
                codePoint == 9 || // HTAB
                codePoint == 32 || // SP
                codePoint == 33 || // %x21
                (codePoint >= 35 && codePoint <= 91) || // %x23-5B
                (codePoint >= 93 && codePoint <= 126) || // %x5D-7E
                (codePoint >= 128 && codePoint <= 255) // %x80-FF
            )
        }

        isows(char) {
            let codePoint = char.codePointAt(0);
            return codePoint == 9 || codePoint == 32
        }
    }

    let accept_header = 'text/* ; q=0.3, text/html ;q=0.7,text/html;level=1,text/htmla  ; lev=2   ; level=3.0;q=0.4;a=a;    b   , */* ;q=0.5;   level="   123   "';

    console.log(accept_header);

    httpParser = new HTTPParser();

    let mediaRanges = null;

    try {
        mediaRanges = await httpParser.parseMediaRange(accept_header);
    }
    catch (e) {
        console.log(e);
    }

    console.log(mediaRanges);
}());