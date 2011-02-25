AUTO_GEN_DIR := public/javascripts/auto_generated
STATIC_JS_WITH_DEV := $(AUTO_GEN_DIR)/static_with_dev.js

all: $(STATIC_JS_WITH_DEV)

clean:
	rm -r $(AUTO_GEN_DIR)

$(STATIC_JS_WITH_DEV): script/produceStaticJSFile.rb
	mkdir $(AUTO_GEN_DIR)
	script/produceStaticJSFile.rb > $(STATIC_JS_WITH_DEV)
