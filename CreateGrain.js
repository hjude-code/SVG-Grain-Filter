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

    createSlider(baseValue, minValue, maxValue, steps, toUpdate, attribute){
        let sliderGroup = document.createElement('div');


        let sliderLabel = document.createElement('label');
        sliderLabel.innerHTML = `${this.channelName} ${attribute}`;
        sliderGroup.appendChild(sliderLabel);

        let slider = document.createElement('input');
        slider.setAttribute('type', 'range');
        slider.setAttribute('value', baseValue);
        slider.setAttribute('min', minValue);
        slider.setAttribute('max', maxValue);
        slider.setAttribute('step', steps);
        sliderGroup.appendChild(slider);

        let input = document.createElement('input');
        input.setAttribute('type', 'number');
        input.setAttribute('value', baseValue);
        input.setAttribute('min', minValue);
        input.setAttribute('max', maxValue);
        input.setAttribute('step', steps);
        sliderGroup.appendChild(input);

        
        slider.addEventListener('input', (x)=>{
            input.value = slider.value;
            toUpdate.forEach((elmnt)=>{
                elmnt.setAttribute(attribute, slider.value);
            })
        })
        input.addEventListener('input', (x)=>{
            slider.value = input.value;
            toUpdate.setAttribute(attribute, input.value);
            toUpdate.forEach((elmnt)=>{
                elmnt.setAttribute(attribute, slider.value);
            })
        })

        return sliderGroup
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
    turbulenceControler(controlPannelElement){
        let grainControls = document.createElement('div');
        let label = document.createElement('p');
        label.innerHTML = `${this.channelName} grain controls`;
        grainControls.appendChild(label)

        let sliders = []
        sliders.push(this.createSlider(this.noise[0],0,1,0.001,[this.basicNoiseFunction], 'baseFrequency'));
        sliders.push(this.createSlider(this.noise[1],0,2,1,[this.basicNoiseFunction], 'numOctaves'));
        

        sliders.forEach((slider)=>{
            grainControls.appendChild(slider);
        })

        controlPannelElement.appendChild(grainControls);
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
    linearControler(controlPannelElement){
        let grainControls = document.createElement('div');
        let label = document.createElement('p');
        label.innerHTML = `${this.channelName} linear controls`;
        grainControls.appendChild(label)

        let children = this.linearFunction.childNodes;

        let sliders = []
        sliders.push(this.createSlider(this.linear[0],-2,2,0.01,children, 'slope'));
        sliders.push(this.createSlider(this.linear[1],-2,2,0.01,children, 'intercept'));
        

        sliders.forEach((slider)=>{
            grainControls.appendChild(slider);
        })

        controlPannelElement.appendChild(grainControls);
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
    gammaControler(controlPannelElement){
        let grainControls = document.createElement('div');
        let label = document.createElement('p');
        label.innerHTML = `${this.channelName} gamma controls`;
        grainControls.appendChild(label)

        let children = this.gammaFunction.childNodes;

        let sliders = []
        sliders.push(this.createSlider(1,-2,2,0.001,children, 'amplitude'));
        sliders.push(this.createSlider(1,-2,2,0.01,children, 'exponent'));
        sliders.push(this.createSlider(1,-2,2,0.01,children, 'offset'));
        

        sliders.forEach((slider)=>{
            grainControls.appendChild(slider);
        })

        controlPannelElement.appendChild(grainControls);
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
        let children = this.colorizeFunction.childNodes;
        const colors = this.parseColorTable(newHex);

        children.forEach((child, index)=>{
            child.setAttribute('tableValues', colors[index])
        })
    }
    colorControler(controlPannelElement){
        let grainControls = document.createElement('div');
        let label = document.createElement('p');
        label.innerHTML = `${this.channelName} color`;
        grainControls.appendChild(label);

        let children = this.colorizeFunction.childNodes;

        let colorPicker = document.createElement('input');
        colorPicker.setAttribute('type', 'color');
        colorPicker.setAttribute('value',this.color);
        colorPicker.addEventListener('input', ()=>{
            this.updateColor(colorPicker.value);
        })


        grainControls.appendChild(colorPicker);


        controlPannelElement.appendChild(grainControls);

        
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

    controls(controlPannelElement){

        const controlGroup = document.createElement('details');
        const controlGroupSummary = document.createElement('summary');
        controlGroupSummary.innerHTML = `${this.channelName} controls`;
        controlGroup.appendChild(controlGroupSummary);
        
        this.turbulenceControler(controlGroup);
        this.linearControler(controlGroup);
        this.gammaControler(controlGroup);
        this.colorControler(controlGroup);

        controlPannelElement.appendChild(controlGroup);
    }

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





const channel_A = new GrainChannel(
    channelName='channel-A',
    color='#e41e26',
    noise = [1, 1],
    linear = [0.6, 0],
    gamma = [1.1, 1.1, 0]
);
const channel_B = new GrainChannel(
    channelName='channel-B',
    color='#78ff00',
    noise = [1, 1],
    linear = [0.7, 0.11],
    gamma = [1, 1, 0]
);

const channel_C = new GrainChannel(
    channelName='channel-C',
    color='#3232ff',
    noise = [1, 1],
    linear = [1.4, -0.16],
    gamma = [1.2, 0.73, 0]
);





channel_A.build(svgFilter);
channel_A.controls(controlPannel);
channel_B.build(svgFilter);
channel_B.controls(controlPannel);
channel_C.build(svgFilter);
channel_C.controls(controlPannel);

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


