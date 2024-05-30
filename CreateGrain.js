const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svgElement.id="GrainEffectElement";
svgElement.setAttribute('display', 'none');
document.body.prepend(svgElement);

const svgFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
svgFilter.id="GrainFilter";
svgFilter.setAttribute('x', 0);
svgFilter.setAttribute('y', 0);
svgFilter.setAttribute('width', '100%');
svgFilter.setAttribute('height', '100%');

svgElement.prepend(svgFilter);



class GrainChannel {
    constructor(
        channelName,
        color = 'ffffff',
        noise = [0.8, 1],
        linear = [1, 0],
        gamma = [1,1,0]
        ){
        this.channelName = channelName,
        this.noise = noise,
        this.linear = linear,
        this.gamma = gamma,
        this.color = color,

        this.functions = [];
        this.basicNoiseFunction;
        this.blendedGrainFunction;
        this.linearFunction;
        this.gammaFunction;
        this.colorizeFunction;
        this.mergeFunction;
    }

    createTag(tagName, id, atttributeList){
        let tag = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        tag.id = `${this.channelName}-${id}`;

        atttributeList.forEach(attribute => {
            tag.setAttribute(attribute[0], attribute[1]);
        });

        return tag
    }

    createTurbulence(){
        this.basicNoiseFunction = this.createTag(
            'feTurbulence',
            'baseGrain',
            [
                ['type','fractalNoise'],
                ['baseFrequency',this.noise[0]],
                ['numOctaves',this.noise[1]],
                ['seed', Math.floor(Math.random())],
                ['result',`${this.channelName}-baseGrain`]
            ]
        );

    };
    updateTurbulence(baseFrequency, numOctaves){
        this.basicNoiseFunction.setAttribute('baseFrequency', baseFrequency);
        this.basicNoiseFunction.setAttribute('numOctaves', numOctaves);

    }

    createBlend(){
        this.blendedGrainFunction = this.createTag(
            'feBlend',
            'blendedGrain',
            [
                ['in',`${this.channelName}-baseGrain`],
                ['in2','SourceGraphic'],
                ['mode', 'color-dodge'],
                ['result',`${this.channelName}-blendedGrain`]
            ]
        );
    };

    createLinear(){
        this.linearFunction = this.createTag(
            'feComponentTransfer',
            'grainLinear',
            [
                ['result',`${this.channelName}-grainLinear`]
            ]
        );

        let children = ['feFuncR', 'feFuncG', 'feFuncB'];

        children.forEach((child)=>{
            let childTag = this.createTag(
                child,
                `grainLinear-${child}`,
                [
                ['type', 'linear'],
                ['slope', this.linear[0]],
                ['intercept', this.linear[1]]
                ]);
            this.linearFunction.appendChild(childTag);
        })
    }
    updateLinear(slope, intercept){
        let children = this.linearFunction.childNodes;
        
        children.forEach((child)=>{
            child.setAttribute('slope', slope);
            child.setAttribute('intercept', intercept);
        })
    }

    createGamma(){
        this.gammaFunction = this.createTag(
            'feComponentTransfer',
            'grainGamma',
            [
                ['result',`${this.channelName}-grainGamma`]
            ]
        );

        let children = ['feFuncR', 'feFuncG', 'feFuncB'];

        children.forEach((child)=>{
            let childTag = this.createTag(
                child,
                `grainGamma-${child}`,
                [
                ['type', 'gamma'],
                ['amplitude', this.gamma[0]],
                ['exponent', this.gamma[1]],
                ['offset', this.gamma[2]]
                ]);
            this.gammaFunction.appendChild(childTag);
        })
    }
    updateGamma(amplitude, exponent, offset){
        let children = this.gammaFunction.childNodes;
        
        children.forEach((child)=>{
            child.setAttribute('amplitude', amplitude);
            child.setAttribute('exponent', exponent);
            child.setAttribute('offset', offset);
        })
    }


    parseColorTable(hex){
        let r = parseInt(hex.substr(1, 2), 16);
            r = (r/255).toFixed(2);
        let g = parseInt(hex.substr(3, 2), 16);
            g = (g/255).toFixed(2);
        let b = parseInt(hex.substr(5, 2), 16);
            b = (b/255).toFixed(2);

        return [r,g,b];
    }
    colorize(){
        this.colorizeFunction = this.createTag(
            'feComponentTransfer',
            'colorize',
            [
                ['result',`${this.channelName}-colorize`]
            ]
        );

        const colors = this.parseColorTable(this.color);

        const funcR = this.createTag(
            'feFuncR',
            `${this.channelName}-colorize-feFuncR`,
            [
                ['type',`discrete`],
                ['tableValues', `0 ${colors[0]}`],
            ]
        );
        this.colorizeFunction.appendChild(funcR);

        const funcG = this.createTag(
            'feFuncG',
            `${this.channelName}-colorize-feFuncG`,
            [
                ['type',`discrete`],
                ['tableValues', `0 ${colors[1]}`],
            ]
        );
        this.colorizeFunction.appendChild(funcG);

        const funcB = this.createTag(
            'feFuncB',
            `${this.channelName}-colorize-feFuncB`,
            [
                ['type',`discrete`],
                ['tableValues', `0 ${colors[2]}`],
            ]
        );
        this.colorizeFunction.appendChild(funcB);
    }
    updateColor(newHex){

        let colorFunc = document.querySelector(`#${this.channelName}-colorize`);
        let channelFuncs = colorFunc.children

        const colors = this.parseColorTable(newHex);

        for(let i = 0; i<channelFuncs.length; i++){
            channelFuncs[i].setAttribute('tableValues', `0 ${colors[i]}`);
          }
    }

    merge(){
        this.mergeFunction = this.createTag(
            'feMerge',
            'merge',
            [
                ['result',`${this.channelName}-merge`]
            ]
        );

        const blendedGrain = this.createTag(
            'feMergeNode',
            `${this.channelName}-merge-blendedGrain`,
            [
                ['in',`${this.channelName}-blendedGrain`]
            ]
        );
        this.mergeFunction.appendChild(blendedGrain);
        
        const grainLinear = this.createTag(
            'feMergeNode',
            `${this.channelName}-merge-grainLinear`,
            [
                ['in',`${this.channelName}-grainLinear`]
            ]
        );
        this.mergeFunction.appendChild(grainLinear);

        const grainGamma = this.createTag(
            'feMergeNode',
            `${this.channelName}-merge-grainGamma`,
            [
                ['in',`${this.channelName}-grainGamma`]
            ]
        );
        this.mergeFunction.appendChild(grainGamma);
        
        const colorize = this.createTag(
            'feMergeNode',
            `${this.channelName}-merge-colorize`,
            [
                ['in',`${this.channelName}-colorize`]
            ]
        );
        this.mergeFunction.appendChild(colorize);

    }



    build(filter){

        this.createTurbulence();
        filter.appendChild(this.basicNoiseFunction);

        this.createBlend();
        filter.appendChild(this.blendedGrainFunction);

        this.createLinear();
        filter.appendChild(this.linearFunction);

        this.createGamma();
        filter.appendChild(this.gammaFunction);

        this.colorize();
        filter.appendChild(this.colorizeFunction);

        this.merge();
        filter.appendChild(this.mergeFunction);

    };

}



const controlPannel = document.createElement('div');
controlPannel.id = 'grainControls';
controlPannel.style.cssText = `
  display: block; 
  position: absolute;
  right:0px;
  top:0px;
  width:50vw;
  font-family:sans-serif;
`;
document.body.appendChild(controlPannel);



let channelA = {
    color:'#e41e26',
    linear:{slope:0.6, intercept:0},
    gamma:{amplitude:1.1, exponent:1.1, offset:0}
}

let channelB = {
    color:'#78ff00',
    linear:{slope:0.7, intercept:0.11},
    gamma:{amplitude:1, exponent:1, offset:0}
}

let channelC = {
    color:'#3232ff',
    linear:{slope:1.4, intercept:-0.16},
    gamma:{amplitude:1.2, exponent:0.73, offset:0}
}

let grainVals = {
    frequency:1,
    octaves:1
}



const channel_A = new GrainChannel(
    channelName='channel-A',
    color=channelA.color,
    noise = [1, 1],
    linear = [channelA.linear.slope, channelA.linear.intercept],
    gamma = [channelA.gamma.amplitude, channelA.gamma.exponent, channelA.gamma.offset]
);
const channel_B = new GrainChannel(
    channelName='channel-B',
    color=channelB.color,
    noise = [1, 1],
    linear = [channelB.linear.slope, channelB.linear.intercept],
    gamma = [channelB.gamma.amplitude, channelB.gamma.exponent, channelB.gamma.offset]
);

const channel_C = new GrainChannel(
    channelName='channel-C',
    color=channelC.color,
    noise = [1, 1],
    linear = [1.4, -0.16],
    gamma = [channelC.gamma.amplitude, channelC.gamma.exponent, channelC.gamma.offset]
);


channel_A.build(svgFilter);
// channel_A.controls(controlPannel);
channel_B.build(svgFilter);
// channel_B.controls(controlPannel);
channel_C.build(svgFilter);
// channel_C.controls(controlPannel);



let gui = new dat.GUI()
let primary = gui.addFolder("Primary Color")
primary.addColor(channelA, "color").onChange(()=>{
    channel_A.updateColor(channelA.color)
})
let linearPrimary = primary.addFolder("linear");
linearPrimary.add(channelA.linear, "slope", 0, 3).onChange(()=>{
    channel_A.updateLinear(channelA.linear.slope, channelA.linear.intercept)
})
linearPrimary.add(channelA.linear, "intercept", -1, 1).onChange(()=>{
    channel_A.updateLinear(channelA.linear.slope, channelA.linear.intercept)
})
let gammaPrimary = primary.addFolder("gamma");
gammaPrimary.add(channelA.gamma, "amplitude", 0.5, 4).onChange(()=>{
    channel_A.updateGamma(channelA.gamma.amplitude, channelA.gamma.exponent, channelA.gamma.offset)
})
gammaPrimary.add(channelA.gamma, "exponent", 0.5, 4).onChange(()=>{
    channel_A.updateGamma(channelA.gamma.amplitude, channelA.gamma.exponent, channelA.gamma.offset)
})
gammaPrimary.add(channelA.gamma, "offset", 0.5, 4).onChange(()=>{
    channel_A.updateGamma(channelA.gamma.amplitude, channelA.gamma.exponent, channelA.gamma.offset)
})


let secondary = gui.addFolder("Secondary Color")
secondary.addColor(channelB, "color").onChange(()=>{
    channel_B.updateColor(channelB.color)
})
let linearSecondary = secondary.addFolder("linear");
linearSecondary.add(channelB.linear, "slope", 0, 3).onChange(()=>{
    channel_B.updateLinear(channelB.linear.slope, channelB.linear.intercept)
})
linearSecondary.add(channelB.linear, "intercept", -1, 1).onChange(()=>{
    channel_B.updateLinear(channelB.linear.slope, channelB.linear.intercept)
})
let gammaSecondary = secondary.addFolder("gamma");
gammaSecondary.add(channelB.gamma, "amplitude", 0.5, 4).onChange(()=>{
    channel_B.updateGamma(channelB.gamma.amplitude, channelB.gamma.exponent, channelB.gamma.offset)
})
gammaSecondary.add(channelB.gamma, "exponent", 0.5, 4).onChange(()=>{
    channel_B.updateGamma(channelB.gamma.amplitude, channelB.gamma.exponent, channelB.gamma.offset)
})
gammaSecondary.add(channelB.gamma, "offset", -1, 1).onChange(()=>{
    channel_B.updateGamma(channelB.gamma.amplitude, channelB.gamma.exponent, channelB.gamma.offset)
})


let tertiary = gui.addFolder("Tertiary Color")
tertiary.addColor(channelC, "color").onChange(()=>{
    channel_C.updateColor(channelC.color)
})
let linearTertiary = tertiary.addFolder("linear")
linearTertiary.add(channelC.linear, "slope", 0, 3).onChange(()=>{
    channel_C.updateLinear(channelC.linear.slope, channelC.linear.intercept)
})
linearTertiary.add(channelC.linear, "intercept", -1, 1).onChange(()=>{
    channel_C.updateLinear(channelC.linear.slope, channelC.linear.intercept)
})
let gammaTertiary = tertiary.addFolder("gamma")
gammaTertiary.add(channelC.gamma, "amplitude", 0.5, 4).onChange(()=>{
    channel_C.updateGamma(channelC.gamma.amplitude, channelC.gamma.exponent, channelC.gamma.offset)
})
gammaTertiary.add(channelC.gamma, "exponent", 0.5, 4).onChange(()=>{
    channel_C.updateGamma(channelC.gamma.amplitude, channelC.gamma.exponent, channelC.gamma.offset)
})
gammaTertiary.add(channelC.gamma, "offset", -1, 1).onChange(()=>{
    channel_C.updateGamma(channelC.gamma.amplitude, channelC.gamma.exponent, channelC.gamma.offset)
})

let grain = gui.addFolder("Grain Control")
grain.add(grainVals, "frequency", 0,1).onChange(()=>{
    channel_A.updateTurbulence(grainVals.frequency, grainVals.octaves)
    channel_B.updateTurbulence(grainVals.frequency, grainVals.octaves)
    channel_C.updateTurbulence(grainVals.frequency, grainVals.octaves)
})
grain.add(grainVals, "octaves", 0,1).onChange(()=>{
    channel_A.updateTurbulence(grainVals.frequency, grainVals.octaves)
    channel_B.updateTurbulence(grainVals.frequency, grainVals.octaves)
    channel_C.updateTurbulence(grainVals.frequency, grainVals.octaves)
})





const blend1 = document.createElementNS("http://www.w3.org/2000/svg", 'feBlend');
blend1.setAttribute('in', 'channel-A-merge');
blend1.setAttribute('in2', 'channel-B-merge');
blend1.setAttribute('mode', 'screen');
blend1.setAttribute('result', 'blend1');

svgFilter.appendChild(blend1);

const blend2 = document.createElementNS("http://www.w3.org/2000/svg", 'feBlend');
blend2.setAttribute('in', 'blend1');
blend2.setAttribute('in2', 'channel-C-merge');
blend2.setAttribute('mode', 'screen');

svgFilter.appendChild(blend2);


